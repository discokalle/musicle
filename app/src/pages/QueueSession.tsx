import { useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";

import Button from "../components/Button";

import { auth, db } from "../firebase";
import { off, onValue, ref, set, update } from "firebase/database";

interface SessionData {
  hostUserId: string;
  participants: Record<string, boolean>;
  queue: Record<string, any>;
  createdAt: number;
  isEnded?: boolean;
}

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
        // handles when the host's session deletion timeout has finished
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

  const handleEndSession = async () => {
    // only the host can press the connected button,
    // so we know that the user here is the host
    const isConfirmed = window.confirm("End session?");
    if (isConfirmed) {
      try {
        await update(ref(db, `sessions/${sessionId}`), { isEnded: true });

        // delete session from DB w/ 5 second delay
        setTimeout(() => {
          set(ref(db, `sessions/${sessionId}`), null);
        }, 5000);
      } catch (e: any) {
        alert(`Error while ending session ${e.message}`);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error.trim() !== "") {
    return <div>Error: {error}</div>;
  }

  if (!sessionData) {
    return <div>Session not found</div>;
  }

  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[40%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        Queue Session ID{" "}
        <span className="italic text-accent font-bold">
          {sessionId || "??"}
        </span>
      </h1>
      <p className="text-neutral text-xl"></p>
      {isHost ? <Button onClick={handleEndSession}>End Session</Button> : null}
    </div>
  );
}

export default QueueSession;
