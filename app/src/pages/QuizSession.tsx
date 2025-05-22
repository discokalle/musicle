import Button from "../components/Button";
import { TrackData } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const getQuizState = httpsCallable<
  { quizId: string },
  { participants: string[]; started: boolean; isrcs?: Record<string, string[]> }
>(functions, "getQuizState");

const startQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "startQuiz"
);

const endQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "endQuiz"
);

const setParticipantIsrc = httpsCallable<
  { quizId: string; userId: string; isrcs: string[] },
  { success: boolean }
>(functions, "setParticipantIsrc");

const getTopTracks = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

function QuizSession() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [participantIsrcMap, setParticipantIsrcMap] = useState<
    Record<string, string[]>
  >({});
  const [numSongsPerParticipant, setNumSongsPerParticipant] = useState(4);

  useEffect(() => {
    if (!quizId || started) return;

    const interval = setInterval(async () => {
      try {
        const res = await getQuizState({ quizId });
        setParticipants(res.data.participants);
        setStarted(res.data.started);
      } catch (e) {
        console.error("Polling failed:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [quizId, started]);

  useEffect(() => {
    if (!quizId || !started) return;

    const fetchIsrcs = async () => {
      try {
        const res = await getQuizState({ quizId });
        const p = res.data.participants;
        const isrcMap = res.data.isrcs || {};
        setParticipants(p);

        const missing = p.filter((uid) => !isrcMap[uid]);

        if (missing.length > 0) {
          const entries = await Promise.all(
            missing.map(async (userId) => {
              try {
                const topTracksRes = await getTopTracks({
                  userId,
                  timeRange: "medium_term",
                });
                const tracks = topTracksRes.data.topTracks;
                if (tracks.length === 0) return [userId, ["No tracks"]];

                const randomTracks = tracks
                  .sort(() => 0.5 - Math.random())
                  .slice(0, numSongsPerParticipant);
                const isrcs = randomTracks.map((t) => t.isrc || "No ISRC");

                await setParticipantIsrc({ quizId, userId, isrcs });

                return [userId, isrcs];
              } catch {
                return [userId, ["Error fetching tracks"]];
              }
            })
          );
          const newEntries = Object.fromEntries(entries);
          setParticipantIsrcMap({ ...isrcMap, ...newEntries });
        } else {
          setParticipantIsrcMap(isrcMap);
        }
      } catch (e) {
        console.error("Failed to fetch ISRCs:", e);
      }
    };

    fetchIsrcs();
  }, [quizId, started, numSongsPerParticipant]);

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
          <h2 className="text-3xl text-neutral">Participants:</h2>
          <ul className="text-neutral">
            {participants.map((uid) => (
              <li key={uid}>{uid}</li>
            ))}
          </ul>

          <label className="mt-4 text-neutral">
            Number of songs per participant:
            <select
              value={numSongsPerParticipant}
              onChange={(e) =>
                setNumSongsPerParticipant(parseInt(e.target.value))
              }
              className="bg-secondary"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <Button onClick={handleStartQuiz}>Start Quiz</Button>
        </>
      ) : (
        <>
          <h1 className="text-3xl text-neutral">Quiz ID: {quizId}</h1>
          <ul className="text-neutral mt-4">
            {participants.map((uid) => (
              <li key={uid}>
                {uid} - ISRCs:
                <ul className="ml-4">
                  {(participantIsrcMap[uid] || ["Loading..."]).map(
                    (isrc, i) => (
                      <li key={i}>{isrc}</li>
                    )
                  )}
                </ul>
              </li>
            ))}
          </ul>
          <Button onClick={handleEndQuiz}>End Quiz</Button>
        </>
      )}
    </div>
  );
}

export default QuizSession;
