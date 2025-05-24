import Button from "../components/Button";
import { TrackData, Question } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";
import { getInfoByISRC } from "../song-info";
import { generateQuestions } from "../question-generator";

const getQuizState = httpsCallable<
  { quizId: string },
  {
    participants: string[];
    started: boolean;
    isrcs?: Record<string, string[]>;
    hostUserId: string;
    questions?: Question[];
    isGeneratingQuestions?: boolean;
  }
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

const storeQuizQuestions = httpsCallable<
  { quizId: string; questions: Question[] },
  { success: boolean }
>(functions, "storeQuizQuestions");

const setGeneratingQuestionsStatus = httpsCallable<
  { quizId: string; status: boolean },
  { success: boolean }
>(functions, "setGeneratingQuestionsStatus");

const getTopTracks = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

function QuizSession() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [rawParticipantIsrcs, setRawParticipantIsrcs] = useState<
    Record<string, string[]>
  >({});
  const [participantIsrcMap, setParticipantIsrcMap] = useState<
    Record<string, string[]>
  >({});
  const [numSongsPerParticipant, setNumSongsPerParticipant] = useState(4);
  const [initialized, setInitialized] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [areQuestionsGenerated, setAreQuestionsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!quizId || started || initialized) return;

    const initialize = async () => {
      try {
        const res = await getQuizState({ quizId });
        const currentParticipants = res.data.participants;
        const isrcMapFromDb = res.data.isrcs || {};
        const hostId = res.data.hostUserId;
        const fetchedQuestions = res.data.questions || [];
        const isGeneratingStatus = res.data.isGeneratingQuestions || false;

        setParticipants(currentParticipants);
        setRawParticipantIsrcs(isrcMapFromDb);
        setIsHost(auth.currentUser?.uid === hostId);
        setQuizQuestions(fetchedQuestions);
        setIsGenerating(isGeneratingStatus);

        if (fetchedQuestions.length > 0) {
          setAreQuestionsGenerated(true);
        }

        const missing = currentParticipants.filter(
          (uid) => !isrcMapFromDb[uid]
        );

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
    if (rawParticipantIsrcs) {
      const trimmedMap: Record<string, string[]> = {};
      for (const [uid, isrcs] of Object.entries(rawParticipantIsrcs)) {
        trimmedMap[uid] = isrcs.slice(0, numSongsPerParticipant);
      }
      if (JSON.stringify(trimmedMap) !== JSON.stringify(participantIsrcMap)) {
        setParticipantIsrcMap(trimmedMap);
      }
    }
  }, [rawParticipantIsrcs, numSongsPerParticipant, participantIsrcMap]);

  useEffect(() => {
    if (started && quizQuestions.length > 0) {
      console.log("Quiz started and questions are available!");
    } else if (started && quizQuestions.length === 0) {
      console.log("Quiz started but no questions available yet.");
    }
  }, [started, quizQuestions]);

  useEffect(() => {
    if (!quizId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getQuizState({ quizId });
        setParticipants(res.data.participants);
        setStarted(res.data.started);
        setIsHost(auth.currentUser?.uid === res.data.hostUserId);
        setRawParticipantIsrcs(res.data.isrcs || {});
        const fetchedQuestions = res.data.questions || [];
        const isGeneratingStatus = res.data.isGeneratingQuestions || false;

        setIsGenerating(isGeneratingStatus);

        if (
          fetchedQuestions.length > 0 &&
          JSON.stringify(fetchedQuestions) !== JSON.stringify(quizQuestions)
        ) {
          setQuizQuestions(fetchedQuestions);
          setAreQuestionsGenerated(true);
        } else if (fetchedQuestions.length === 0) {
          setAreQuestionsGenerated(false);
        }
      } catch (e) {
        console.error("Polling failed:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [quizId, quizQuestions]);

  const generateAndStoreAllQuestions = async () => {
    await setGeneratingQuestionsStatus({ quizId: quizId!, status: true });
    setIsGenerating(true);

    const allGeneratedQuestions: Question[] = [];

    if (Object.keys(participantIsrcMap).length === 0) {
      console.warn("No participant ISRCs available to generate questions.");
      await setGeneratingQuestionsStatus({ quizId: quizId!, status: false });
      setIsGenerating(false);
      return false;
    }

    for (const [userId, isrcs] of Object.entries(participantIsrcMap)) {
      for (const isrc of isrcs) {
        try {
          const song = await getInfoByISRC(isrc);
          if (!song) continue;

          const allQuestionsForSong = generateQuestions(song);
          if (allQuestionsForSong.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * allQuestionsForSong.length
            );
            allGeneratedQuestions.push(allQuestionsForSong[randomIndex]);
          }
        } catch (e) {
          console.error(`Error generating question for ISRC ${isrc}:`, e);
        }
      }
    }

    if (allGeneratedQuestions.length > 0) {
      try {
        await storeQuizQuestions({
          quizId: quizId!,
          questions: allGeneratedQuestions,
        });
        setQuizQuestions(allGeneratedQuestions);
        setAreQuestionsGenerated(true);
        console.log("Host successfully stored all quiz questions.");
        await setGeneratingQuestionsStatus({ quizId: quizId!, status: false });
        setIsGenerating(false);
        return true;
      } catch (e) {
        console.error("Host failed to store quiz questions:", e);
        await setGeneratingQuestionsStatus({ quizId: quizId!, status: false });
        setIsGenerating(false);
        return false;
      }
    } else {
      console.warn("No questions generated for the quiz.");
      await setGeneratingQuestionsStatus({ quizId: quizId!, status: false });
      setIsGenerating(false);
      return false;
    }
  };

  const handleStartQuiz = async () => {
    if (!quizId) return;

    if (!isHost) {
      alert("Only the host can start the quiz.");
      return;
    }

    if (isGenerating) {
      alert("Questions are currently being generated. Please wait.");
      return;
    }

    if (areQuestionsGenerated) {
      console.log("Questions already generated. Proceeding to start quiz.");
    } else {
      const generationSuccess = await generateAndStoreAllQuestions();
      if (!generationSuccess) {
        alert(
          "Failed to generate and store quiz questions. Cannot start quiz."
        );
        return;
      }
    }

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

  const totalPotentialQuestions = participants.length * numSongsPerParticipant;

  if (isGenerating) {
    return (
      <div className={centerContainerCSS}>
        <h1 className="text-3xl text-neutral">
          Generating questions, this may take a while...
        </h1>
      </div>
    );
  }

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

          {isHost && (
            <>
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
              {participants.length > 0 && !areQuestionsGenerated && (
                <p className="text-sm text-neutral mt-2">
                  Ready to generate {totalPotentialQuestions} questions.
                </p>
              )}
              {areQuestionsGenerated && (
                <p className="text-sm text-neutral mt-2">
                  Questions generated and stored ({quizQuestions.length} total).
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h1 className="text-3xl text-neutral">Quiz ID: {quizId}</h1>
          <h2 className="text-2xl text-neutral mt-4">Quiz Questions:</h2>
          <ul className="text-neutral mt-2">
            {quizQuestions.length === 0 ? (
              <div className="italic text-neutral">
                Loading or no questions generated for this quiz.
              </div>
            ) : (
              quizQuestions.map((q, index) => (
                <li key={index} className="mb-4">
                  <div className="font-semibold">
                    {index + 1}. {q.question}
                  </div>
                  <ul className="ml-4 list-disc">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                  {isHost && (
                    <div className="text-green-400">Answer: {q.answer}</div>
                  )}
                </li>
              ))
            )}
          </ul>
          {isHost && <Button onClick={handleEndQuiz}>End Quiz</Button>}
        </>
      )}
    </div>
  );
}

export default QuizSession;
