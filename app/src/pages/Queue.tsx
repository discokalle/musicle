import Button from "../components/Button";

import { useLocation, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";

import { functions } from "../firebase";
import { useEffect } from "react";

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

  // handles alert passed from QueueSession (e.g., to alert the user that
  // the host ended the session)
  useEffect(() => {
    if (location.state?.message) {
      const timerId = setTimeout(() => {
        alert(location.state.message);
        navigate(location.pathname, { replace: true, state: {} }); // reset state to avoid re-alerting
      }, 50);

      return () => clearTimeout(timerId);
    }
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
      // alert("Queue session created successfully!");
      navigate(sessionId);
    } catch (e: any) {
      console.log(e.code, e.message);
    }
  };
  const handleJoinSession = async () => {
    const sessionIdInput = window.prompt(
      "Please enter the Session ID to join:"
    );

    if (sessionIdInput === null) {
      return;
    }

    if (sessionIdInput.trim() === "") {
      alert("Invalid Session ID. Please try again.");
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

  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[40%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is{" "}
        <span className="italic text-accent font-bold">THE LIVE QUEUE!</span>
      </h1>
      <p className="text-neutral text-xl">
        Gather your friends and queue songs in a joint Spotify session in
        real-time!
      </p>

      <div className="flex gap-10">
        <Button onClick={handleCreateSession}>Create Queue</Button>
        <Button onClick={handleJoinSession}>Join Queue</Button>
      </div>
    </div>
  );
}

export default Queue;
