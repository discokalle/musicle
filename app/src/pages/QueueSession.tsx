import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { off, onValue, ref, set, update } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import clsx from "clsx";

import Button from "../components/Button";
import SearchBarApi from "../components/SearchBarApi";
import QueueListItem from "../components/QueueListItem";
import LoadingAnimation from "../components/LoadingAnimation";

import { auth, db, functions } from "../firebase";
import TrackListItem from "../components/TrackListItem";

import { SessionData, TrackData } from "../types";
import {
  linkHighlightCSS,
  panelCardCSS,
  xSeparatorCSS,
  subtitleCSS,
  titleCSS,
} from "../styles";

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
  // used to avoid enqueueing more than one song when a certain song is ending
  const currEndingTrackUriRef = useRef<string>("");
  // used to override Spotify's auto-play when a new song has been enqueued in the app
  const lastPlayedByAppUriRef = useRef<string | null>(null);
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [activeSpotifyDevices, setActiveSpotifyDevices] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // sets up a poll until the host has chosen an
  // active Spotify device to connect to
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchSpotifyDevices = async () => {
      const res = await getActiveSpotifyDevices();

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

  // useCallback memoizes the function so that it is not re-rendered
  // unless its dependency is changed (i.e., the sessionId);
  // thus, the effect below can use the function as a stable dependency
  const updateCurrentTrack = useCallback(
    async (track: TrackData) => {
      try {
        if (sessionId) {
          await update(ref(db, `sessions/${sessionId}`), {
            currentTrack: track,
          });
        }
      } catch (error) {
        console.error("Failed to update current track:", error);
      }
    },
    [sessionId]
  );

  // listens to when Spotify playback state changes,
  // and plays the next track
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const buffer = 7000; // ms

    const monitorPlaybackState = async () => {
      if (typeof sessionId !== "string" || !sessionData?.deviceId) {
        return;
      }

      try {
        const resPlayback = await getSpotifyPlaybackState();
        const currState = resPlayback.data.playbackState;

        if (!currState || !currState.item) return;

        const currTrack = currState.item;
        await updateCurrentTrack({
          uri: currTrack.uri,
          name: currTrack.name,
          artist: currTrack.artists[0].name,
          album: currTrack.album?.name,
          albumCoverUrl: currTrack.album?.images?.[0]?.url,
          isrc: currTrack.external_ids.isrc,
        } as TrackData);

        if (currState.item.uri !== currEndingTrackUriRef.current) {
          currEndingTrackUriRef.current = "";
        }

        // we play the next track in queue if:
        // - this is the first song to be enqueued
        // - the current playing song was not enqueued through the app
        // - the previous song that we played is about to end
        if (
          (((!lastPlayedByAppUriRef.current ||
            currState.item.uri !== lastPlayedByAppUriRef.current) &&
            sessionData?.queue &&
            Object.keys(sessionData.queue).length > 0) ||
            currState?.progress_ms >= currState?.item?.duration_ms - buffer) &&
          currEndingTrackUriRef.current !== currState.item.uri
        ) {
          currEndingTrackUriRef.current = currState.item.uri;

          const resTrack = await playNextTrack({
            sessionId: sessionId,
          });

          lastPlayedByAppUriRef.current = resTrack.data.playedTrackData.uri;
        }
      } catch (e: any) {
        console.log(e.message);
      }
    };

    if (isHost && sessionData?.deviceId) {
      monitorPlaybackState();

      interval = setInterval(monitorPlaybackState, buffer / 2);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isHost,
    sessionData?.deviceId,
    sessionData?.queue,
    sessionId,
    updateCurrentTrack,
  ]);

  // listens for changes to the session in RTDB and
  // updates the sessionData state accordingly
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
    return <LoadingAnimation></LoadingAnimation>;
  }

  if (error.trim() !== "") {
    return <div className={titleCSS}>Error: {error}</div>;
  }

  if (!sessionData || !sessionId) {
    return <div className={titleCSS}>Session not found</div>;
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
      await addTrackToQueue({ sessionId, trackData: recTrackData });
    } catch (e: any) {
      console.log(`An error occurred during the match logic: ${e.message}`);
    }
  };

  const searchBarRenderRec = (rec: TrackData, onClickLogic: () => void) => {
    return (
      <TrackListItem
        key={rec.uri}
        track={rec}
        onClickLogic={onClickLogic}
        includeAlbumName={false}
        className="!bg-primary cursor-pointer m-1"
      ></TrackListItem>
    );
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

  const containerCSS =
    "absolute w-[75%] flex flex-col gap-7 items-center left-1/2 top-1/6\
     transform -translate-x-1/2 bg-secondary py-6 px-10 rounded-md";

  if (!sessionData.deviceId) {
    return (
      <div className={containerCSS}>
        <h1 className={titleCSS}>Choose a device</h1>
        <ul className="list-group space-y-2">
          {activeSpotifyDevices.map((item, index) => (
            <li
              key={index}
              className={clsx(linkHighlightCSS, panelCardCSS, "!bg-primary")}
              onClick={() => {
                handleChosenDevice(item.id, item.name);
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={containerCSS}>
      <div className={clsx(panelCardCSS, "!bg-primary flex flex-col gap-3")}>
        <h1 className={subtitleCSS}>
          Session ID:
          <>&nbsp;&nbsp;</>
          <span
            className={clsx(linkHighlightCSS, "italic font-bold")}
            onClick={handleCopySessionId}
            title="Copy session ID?"
          >
            {sessionId}
          </span>
        </h1>
        <div className={xSeparatorCSS}></div>
        <p className={"text-large text-neutral text-center"}>
          Playing on "{sessionData.deviceName}"
        </p>
      </div>
      {sessionData?.currentTrack ? (
        <div className="relative flex flex-col gap-2 px-[20%] items-start">
          <h1 className="px-2 text-large text-neutral text-center whitespace-nowrap italic">
            Currently playing...{" "}
          </h1>
          <TrackListItem
            track={sessionData.currentTrack}
            className="!bg-primary"
          ></TrackListItem>
        </div>
      ) : (
        <p className="text-neutral">No track is currently playing.</p>
      )}
      <SearchBarApi
        apiCall={searchBarApiCall}
        matchLogic={searchBarMatchLogic}
        renderRec={searchBarRenderRec}
        inputPlaceholderText="Search for a track..."
        className="w-150"
      ></SearchBarApi>
      <ul className="list-group space-y-2 text-neutral">
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
                className="!bg-primary"
              ></QueueListItem>
            ))
        ) : (
          <div>No tracks are currently in the queue.</div>
        )}
      </ul>
      {isHost && (
        <Button
          onClick={handleEndSession}
          className="!bg-primary absolute right-3 top-3"
        >
          End Session
        </Button>
      )}
    </div>
  );
}

export default QueueSession;
