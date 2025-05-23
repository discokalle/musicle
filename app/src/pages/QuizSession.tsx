import Button from "../components/Button";
import { TrackData, Question } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { getInfoByISRC } from "../song-info";
import { generateQuestions } from "../question-generator";

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

const storeQuestions = httpsCallable<
  { quizId: string; userId: string; questions: Question[] },
  { success: boolean }
>(functions, "storeQuestions");

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
  const [initialized, setInitialized] = useState(false);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question[]>>(
    {}
  );

  useEffect(() => {
    if (!quizId || started || initialized) return;

    const initialize = async () => {
      try {
        const res = await getQuizState({ quizId });
        const currentParticipants = res.data.participants;
        const isrcMap = res.data.isrcs || {};
        setParticipants(currentParticipants);

        const missing = currentParticipants.filter((uid) => !isrcMap[uid]);

        if (missing.length > 0) {
          await Promise.all(
            missing.map(async (userId) => {
              try {
                const topTracksRes = await getTopTracks({
                  userId,
                  timeRange: "medium_term",
                });
                const tracks = topTracksRes.data.topTracks;
                if (tracks.length === 0) {
                  await setParticipantIsrc({
                    quizId,
                    userId,
                    isrcs: ["No tracks"],
                  });
                } else {
                  const randomTracks = tracks
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 5);
                  const isrcs = randomTracks.map((t) => t.isrc || "No ISRC");
                  await setParticipantIsrc({ quizId, userId, isrcs });
                }
              } catch {
                await setParticipantIsrc({
                  quizId,
                  userId,
                  isrcs: ["Error fetching tracks"],
                });
              }
            })
          );
        }

        setInitialized(true);
      } catch (e) {
        console.error("Initialization failed:", e);
      }
    };

    initialize();
  }, [quizId, started, initialized]);

  useEffect(() => {
    if (!quizId || !started) return;

    const fetchIsrcs = async () => {
      try {
        const res = await getQuizState({ quizId });
        const p = res.data.participants;
        const isrcMap = res.data.isrcs || {};
        setParticipants(p);

        const trimmedMap: Record<string, string[]> = {};
        for (const [uid, isrcs] of Object.entries(isrcMap)) {
          trimmedMap[uid] = isrcs.slice(0, numSongsPerParticipant);
        }

        setParticipantIsrcMap(trimmedMap);
      } catch (e) {
        console.error("Failed to fetch ISRCs:", e);
      }
    };

    fetchIsrcs();
  }, [quizId, started, numSongsPerParticipant]);

  useEffect(() => {
    if (!started || !quizId) return;

    const loadQuestions = async () => {
      const newQuestionsMap: Record<string, Question[]> = {};

      for (const [userId, isrcs] of Object.entries(participantIsrcMap)) {
        const userQuestions: Question[] = [];

        for (const isrc of isrcs) {
          try {
            const song = await getInfoByISRC(isrc);
            if (!song) continue;

            const allQuestions = generateQuestions(song);
            if (allQuestions.length > 0) {
              const randomIndex = Math.floor(
                Math.random() * allQuestions.length
              );
              userQuestions.push(allQuestions[randomIndex]);
            }
          } catch {
            // ignore error
          }
        }

        newQuestionsMap[userId] = userQuestions;

        try {
          await storeQuestions({ quizId, userId, questions: userQuestions });
        } catch (e) {
          console.error(`Failed to store questions for ${userId}:`, e);
        }
      }

      setQuestionsMap(newQuestionsMap);
    };

    loadQuestions();
  }, [participantIsrcMap, started, quizId]);

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
              <li key={uid} className="mb-4">
                <div>{uid} - Questions:</div>
                {!questionsMap[uid] || questionsMap[uid].length === 0 ? (
                  <div className="italic text-neutral">
                    Loading or no questions
                  </div>
                ) : (
                  questionsMap[uid].map((q, index) => (
                    <div key={index} className="mb-4">
                      <div className="font-semibold">{q.question}</div>
                      <ul className="ml-4 list-disc">
                        {q.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
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
