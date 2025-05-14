import { useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { off, onValue, ref, set, update } from "firebase/database";
import { httpsCallable } from "firebase/functions";

import Button from "../components/Button";
import SearchBarApi from "../components/SearchBarApi";

import { SessionData, TrackData } from "../types";

import { auth, db, functions } from "../firebase";
import List from "../components/List";
import QueueListItem from "../components/QueueListItem";

const getActiveSpotifyDevices = httpsCallable<undefined, { devices: any[] }>(
  functions,
  "getActiveSpotifyDevices"
);

const setSpotifyDevice = httpsCallable<
  { sessionId: string; deviceId: string; deviceName: string },
  { success: boolean; message: string }
>(functions, "setSpotifyDevice");

const getSpotifyPlaybackState = httpsCallable<
  undefined,
  { playbackState: any }
>(functions, "getSpotifyPlaybackState");

const searchSpotifyTracks = httpsCallable<
  { sessionId: string; query: string },
  { results: TrackData }
>(functions, "searchSpotifyTracks");

const addTrackToQueue = httpsCallable<
  {
    sessionId: string;
    trackData: TrackData;
  },
  { success: boolean; queueItemId: string }
>(functions, "addTrackToQueue");

const playNextTrack = httpsCallable<
  { sessionId: string },
  {
    success: boolean;
    message: string;
    playedTrackData: TrackData;
  }
>(functions, "playNextTrack");

function QueueSession() {
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [activeSpotifyDevices, setActiveSpotifyDevices] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchSpotifyDevices = async () => {
      const res = await getActiveSpotifyDevices();

      // console.log(Date.now(), res.data);

      if (res.data.devices) {
        setActiveSpotifyDevices(res.data.devices);
      }
    };

    if (isHost && !sessionData?.deviceId) {
      fetchSpotifyDevices();

      interval = setInterval(fetchSpotifyDevices, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, sessionData?.deviceId]);

  // listens to when Spotify playback state changes, and plays the next track
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let prevState: any = null;

    const monitorPlaybackState = async () => {
      if (typeof sessionId !== "string") {
        return;
      }
      if (typeof sessionData?.deviceId !== "string") {
        return;
      }

      try {
        const resPlayback = await getSpotifyPlaybackState();
        const currState = resPlayback.data.playbackState;
        // TO-DO: change this logic
        // (waiting for a song to end and see if currState is not playing will not work
        // because Spotify always auto-queues a new song even if the queue is empty)
        if (
          prevState?.is_playing &&
          !currState.is_playing &&
          prevState.progress_ms >= prevState.item.duration_ms - 5000 // buffer
        ) {
          const resTrack = await playNextTrack({
            sessionId: sessionId,
          });

          if (resTrack && resTrack.data.playedTrackData) {
            updateCurrentTrack(resTrack.data.playedTrackData);
          }
        }

        if (currState && prevState) {
          console.log(
            prevState.is_playing,
            currState.is_playing,
            prevState.progress_ms,
            prevState.item.duration_ms
          );
        }

        prevState = currState;
      } catch (e: any) {
        console.log(e.message);
      }
    };

    if (isHost && sessionData?.deviceId) {
      monitorPlaybackState();

      interval = setInterval(monitorPlaybackState, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, sessionData?.deviceId, sessionId]);

  // listens for changes to the RTDB and updates the sessionData state
  useEffect(() => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setIsLoading(false);
      navigate("/queue", { state: { message: "Session ID is missing." } });
      return;
    }

    setIsLoading(true);
    const sessionRef = ref(db, `sessions/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        // hasNavigatedRef handles when the host's session deletion timeout has finished
        // (to avoid sending multiple alerts after redirecting)
        if (hasNavigatedRef.current) {
          return;
        }

        if (snapshot.exists()) {
          const data = snapshot.val() as SessionData;
          setSessionData(data);
          setError("");

          // console.log(sessionData);

          setIsHost(data.hostUserId === auth.currentUser?.uid);

          if (data.isEnded) {
            hasNavigatedRef.current = true;
            navigate("/queue", {
              state: { message: "Session was ended by the host." },
            });
            return;
          }
        } else {
          hasNavigatedRef.current = true;
          setError("Session does not exist or has been removed");
          setSessionData(null);
          navigate("/queue", { state: { message: "Session not found." } });
          return;
        }
        setIsLoading(false);
      },
      (e) => {
        setError(`Failed to listen to session updates: ${e.message}`);
        setIsLoading(false);
      }
    );

    return () => {
      off(sessionRef, "value", unsubscribe);
    };
  }, [sessionId, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error.trim() !== "") {
    return <div>Error: {error}</div>;
  }

  // console.log(sessionData, sessionId);
  if (!sessionData || !sessionId) {
    return <div>Session not found</div>;
  }

  const handleEndSession = async () => {
    // only the host can press the connected button,
    // so we know that the user here is the host
    const isConfirmed = window.confirm("End session?");
    if (isConfirmed) {
      try {
        await set(
          ref(db, `users/${auth.currentUser?.uid}/hostingSessionId`),
          null
        );
        await update(ref(db, `sessions/${sessionId}`), { isEnded: true });

        // delete session from DB w/ 2 second delay
        setTimeout(() => {
          set(ref(db, `sessions/${sessionId}`), null);
        }, 2000);
      } catch (e: any) {
        alert(`Error while ending session ${e.message}`);
      }
    }
  };

  const searchBarApiCall = async (query: string) => {
    const res = await searchSpotifyTracks({ sessionId, query });
    return res;
  };

  const searchBarMatchLogic = async (recTrackData: TrackData) => {
    try {
      // console.log(recTrackData);
      await addTrackToQueue({ sessionId, trackData: recTrackData });
    } catch (e: any) {
      console.log(`An error occurred during the match logic: ${e.message}`);
    }
  };

  const searchBarRenderRec = (rec: any) => {
    return <div>{rec.name + " – " + rec.artist}</div>;
  };

  const handleCopySessionId = async () => {
    if (!sessionId) return;

    try {
      await navigator.clipboard.writeText(sessionId);
      alert("Successfully copied session ID.");
    } catch (e: any) {
      alert("Failed to copy session ID.");
    }
  };

  const handleChosenDevice = async (id: string, name: string) => {
    if (!isHost) return;

    setIsLoading(true);

    try {
      await setSpotifyDevice({
        sessionId: sessionId,
        deviceId: id,
        deviceName: name,
      });
    } catch (e: any) {
      console.log(e.message);
    }

    setIsLoading(false);
  };

  const updateCurrentTrack = async (track: TrackData) => {
    try {
      if (sessionId) {
        await update(ref(db, `sessions/${sessionId}`), {
          currentTrack: track,
        });
      }
    } catch (error) {
      console.error("Failed to update current track:", error);
    }
  };

  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[25%] transform -translate-x-1/2 bg-secondary \
     py-6 px-10 rounded-md";

  // console.log(activeSpotifyDevices);
  if (!sessionData.deviceId) {
    return (
      <div className={centerContainerCSS}>
        <h1 className="text-5xl text-neutral text-center">Choose a device</h1>
        <List>
          {activeSpotifyDevices.map((item, index) => (
            <li
              key={index}
              className="panel-card cursor-pointer link-highlight"
              onClick={() => {
                handleChosenDevice(item.id, item.name);
              }}
            >
              {item.name}
            </li>
          ))}
        </List>
      </div>
    );
  }

  return (
    <div className={centerContainerCSS}>
      <h1 className="text-3xl text-neutral text-center">
        Session ID:<br></br>
        <span
          className="italic text-accent font-bold cursor-pointer link-highlight"
          onClick={handleCopySessionId}
          title="Copy session ID?"
        >
          {sessionId}
        </span>
      </h1>
      <p className="text-2xl text-neutral text-center">
        Playing on "{sessionData.deviceName}"
      </p>
      {sessionData?.currentTrack && (
        <p className="text-xl text-neutral text-center">
          Currently playing "{sessionData.currentTrack.name}" by "
          {sessionData.currentTrack.artist}"
        </p>
      )}
      <SearchBarApi
        apiCall={searchBarApiCall}
        matchLogic={searchBarMatchLogic}
        renderRec={searchBarRenderRec}
        inputPlaceholderText="Search for a track..."
      ></SearchBarApi>
      <List className="text-neutral">
        {sessionData?.queue && Object.keys(sessionData.queue).length > 0 ? (
          Object.entries(sessionData.queue)
            // sort queue in descending order based on vote count
            .sort(([, a], [, b]) => b.voteCount - a.voteCount)
            .map(([itemId, item]) => (
              <QueueListItem
                key={itemId}
                sessionId={sessionId}
                id={itemId}
                data={item}
              ></QueueListItem>
            ))
        ) : (
          <div>No tracks in the queue.</div>
        )}
      </List>
      {isHost && <Button onClick={handleEndSession}>End Session</Button>}
    </div>
  );
}

export default QueueSession;
