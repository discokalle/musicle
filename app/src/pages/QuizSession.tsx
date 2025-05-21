import Button from "../components/Button";
import { TrackData } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const getQuizState = httpsCallable<
  { quizId: string },
  { participants: string[]; started: boolean }
>(functions, "getQuizState");

const startQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "startQuiz"
);

const endQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "endQuiz"
);

const getTopTracks = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

function QuizSession() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [topTrackIsrc, setTopTrackIsrc] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchState = () => {
      getQuizState({ quizId })
        .then((res) => {
          setParticipants(res.data.participants);
          setStarted(res.data.started);
        })
        .catch((e: any) => {
          console.error("Failed to fetch quiz state:", e.message);
        });
    };

    fetchState();

    const interval = setInterval(fetchState, 5000); //sync every 5 sec
    return () => clearInterval(interval);
  }, [quizId]);

  const handleStartQuiz = async () => {
    if (!quizId) return;
    try {
      const res = await startQuiz({ quizId });
      if (res.data.success) {
        setStarted(true);
      } else {
        alert("Failed to start quiz.");
      }
    } catch (e: any) {
      alert(`Error starting quiz: ${e.message}`);
    }
  };

  const handleEndQuiz = async () => {
    if (!quizId) return;

    try {
      const res = await endQuiz({ quizId });
      if (res.data.success) {
        alert("Quiz ended.");
        navigate("/quiz/multi");
      } else {
        alert("Failed to end quiz.");
      }
    } catch (e: any) {
      alert(`Error ending quiz: ${e.message}`);
    }
  };

  const centerContainerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";
  return (
    <div className={centerContainerCSS}>
      {!started ? (
        <>
          <h2 className="text-neutral mt-4 text-xl">Participants:</h2>
          <ul className="text-neutral mt-2">
            {participants.map((uid) => (
              <li key={uid}>{uid}</li>
            ))}
          </ul>
          <Button onClick={handleStartQuiz}>Start Quiz</Button>
        </>
      ) : (
        <>
          <h1 className="text-3xl text-neutral text-center">
            Quiz ID: {quizId}
          </h1>
          <Button onClick={handleEndQuiz}>End Quiz</Button>
        </>
      )}
    </div>
  );
}

export default QuizSession;
