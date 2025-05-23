import Button from "../components/Button";
import LoadingAnimation from "../components/LoadingAnimation";

import { useLocation, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";

import { auth, db, functions } from "../firebase";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";

import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";

const createSession = httpsCallable<{}, { sessionId: string }>(
  functions,
  "createSession"
);
const joinSession = httpsCallable<{ sessionId: string }, { success: boolean }>(
  functions,
  "joinSession"
);

function Queue() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // handles alert passed from QueueSession (e.g., to alert the user that
    // the host ended the session)
    if (location.state?.message) {
      // alert w/ small delay to allow re-navigation to complete
      const timerId = setTimeout(() => {
        alert(location.state.message);
        navigate(location.pathname, { replace: true, state: {} }); // reset state to avoid re-alerting
      }, 50);

      return () => clearTimeout(timerId);
    }

    const handleIfUserIsHosting = async () => {
      try {
        const snapshot = await get(
          ref(db, `users/${auth.currentUser?.uid}/hostingSessionId`)
        );

        if (snapshot.exists()) {
          navigate(snapshot.val());
        }
      } catch (e: any) {
        console.log("Error:", e.message);
      } finally {
        setIsLoading(false);
      }
    };

    handleIfUserIsHosting();
  }, [location.state?.message, navigate]);

  const handleCreateSession = async () => {
    try {
      const res = await createSession();
      if (!res) {
        alert("Failed to create Queue session.");
        return;
      }

      const data = res.data as { sessionId: string };
      const sessionId = data.sessionId;
      navigate(sessionId);
    } catch (e: any) {
      alert(`Failed to create Queue session: ${e.message}`);
      console.log(e.code, e.message);
    }
  };

  const handleJoinSession = async () => {
    const sessionIdInput = window.prompt(
      "Please enter the Session ID to join:"
    );

    if (sessionIdInput === null || sessionIdInput.trim() === "") {
      return;
    }

    try {
      const res = await joinSession({ sessionId: sessionIdInput });
      if (!res || !res.data?.success) {
        alert("Failed to join Queue session.");
        return;
      }

      navigate(sessionIdInput);
    } catch (e: any) {
      alert(`An error occurred while attempting to connect: ${e.message}`);
    }
  };

  if (isLoading) {
    return <LoadingAnimation></LoadingAnimation>;
  }

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is{" "}
        <span className="italic text-accent font-bold">THE LIVE QUEUE</span>
      </h1>
      <p className={subtitleCSS}>
        Gather your friends and queue songs fairly with a voting system in
        real-time!
      </p>

      <div className="flex gap-10">
        <Button onClick={handleCreateSession} size="large">
          Create
        </Button>
        <Button onClick={handleJoinSession} size="large">
          Join
        </Button>
      </div>
    </div>
  );
}

export default Queue;
