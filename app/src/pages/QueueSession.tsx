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

function QueueSession() {
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[25%] transform -translate-x-1/2 bg-secondary \
     p-10 rounded-md";

  const titleCSS = "text-5xl text-neutral text-center";

  return (
    <div className={centerContainerCSS}>
      <div className={titleCSS}>
        <h1>Queue Session ID</h1>
        <h1
          className="italic text-accent font-bold cursor-pointer link-highlight"
          onClick={handleCopySessionId}
          title="Copy session ID?"
        >
          {sessionId || "??"}
        </h1>
      </div>
      <p className="text-neutral text-xl"></p>
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
                id={itemId}
                sessionId={sessionId}
                track={item.track}
                votes={
                  item.votes ? new Set(Object.keys(item.votes)) : new Set()
                }
                voteCount={item.voteCount}
                suggesterUsername={item.suggesterUsername}
              ></QueueListItem>
            ))
        ) : (
          <div>No tracks in the queue.</div>
        )}
      </List>
      {isHost ? <Button onClick={handleEndSession}>End Session</Button> : null}
    </div>
  );
}

export default QueueSession;
