import Button from "../components/Button";
import QuizCard from "../components/QuizCard";
import { TrackData, Question } from "../types";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";
import { getInfoByISRC } from "../song-info";
import { generateQuestions } from "../question-generator";
import LoadingAnimation from "../components/LoadingAnimation";

//Cloud state of the quiz
const getQuizState = httpsCallable<
  { quizId: string },
  {
    participants: string[];
    usernames: Record<string, string>;
    started: boolean;
    isrcs?: Record<string, string[]>;
    hostUserId: string;
    questions?: Question[];
    isGeneratingQuestions?: boolean;
    currentQuestionIndex?: number;
    currentQuestionAnswers?: Record<string, string>;
    scores?: Record<string, number>;
    isQuizOver?: boolean;
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

const submitQuizAnswer = httpsCallable<
  { quizId: string; questionIndex: number; selectedOption: string },
  { success: boolean; isCorrect: boolean }
>(functions, "submitQuizAnswer");

const advanceQuizQuestion = httpsCallable<
  { quizId: string; newQuestionIndex: number },
  { success: boolean }
>(functions, "advanceQuizQuestion");

//Main part of the quiz session
function QuizSession() {
  //State variables for managing quiz data
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined
  );
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [allScores, setAllScores] = useState<Record<string, number>>({});
  const [isShowingScores, setIsShowingScores] = useState(false);
  const [usersAnswered, setUsersAnswered] = useState<string[]>([]);
  const [isQuizOver, setIsQuizOver] = useState(false);

  //Refs for stable state values in effects that dont need displaying.
  const currentQuestionRef = useRef<number>(0);
  const isShowingScoresRef = useRef<boolean>(false);

  //Initial data fetch and setup
  useEffect(() => {
    if (!quizId || started || initialized) return;

    const initialize = async () => {
      try {
        const res = await getQuizState({ quizId });
        const fetchedParticipantIds = res.data.participants;
        const fetchedUsernames = res.data.usernames || {};
        const isrcMapFromDb = res.data.isrcs || {};
        const hostId = res.data.hostUserId;
        const fetchedQuestions = res.data.questions || [];
        const isGeneratingStatus = res.data.isGeneratingQuestions || false;
        const fetchedCurrentQuestionIndex = res.data.currentQuestionIndex ?? 0;
        const fetchedScores = res.data.scores || {};
        const fetchedCurrentQuestionAnswers =
          res.data.currentQuestionAnswers || {};
        const fetchedIsQuizOver = res.data.isQuizOver ?? false;

        setParticipantIds(fetchedParticipantIds);
        setUsernames(fetchedUsernames);
        setRawParticipantIsrcs(isrcMapFromDb);
        setIsHost(auth.currentUser?.uid === hostId);
        setQuizQuestions(fetchedQuestions);
        setIsGenerating(isGeneratingStatus);
        setCurrentQuestionIndex(fetchedCurrentQuestionIndex);
        currentQuestionRef.current = fetchedCurrentQuestionIndex;
        setUserScore(fetchedScores[auth.currentUser?.uid || ""] || 0);
        setAllScores(fetchedScores);
        setUsersAnswered(Object.keys(fetchedCurrentQuestionAnswers));
        setIsQuizOver(fetchedIsQuizOver);

        if (fetchedQuestions.length > 0) {
          setAreQuestionsGenerated(true);
        }
        if (res.data.started) {
          setStarted(true);
        }

        //Fetch missing participant song data
        const missing = fetchedParticipantIds.filter(
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
              } catch (e) {
                console.error(`Error fetching tracks for ${userId}:`, e);
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

  //Adjust participant song map
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

  //Polling for real-time quiz state updates
  useEffect(() => {
    if (!quizId) return;

    const POLLING_INTERVAL = 500; //Poll every 500ms

    const interval = setInterval(async () => {
      try {
        const res = await getQuizState({ quizId });
        const newParticipantIds = res.data.participants;
        const newStartedStatus = res.data.started;
        const newIsHost = auth.currentUser?.uid === res.data.hostUserId;
        const newRawParticipantIsrcs = res.data.isrcs || {};
        const fetchedQuestions = res.data.questions || [];
        const isGeneratingStatus = res.data.isGeneratingQuestions || false;
        const fetchedCurrentQuestionIndex = res.data.currentQuestionIndex ?? 0;
        const fetchedScores = res.data.scores || {};
        const fetchedCurrentQuestionAnswers =
          res.data.currentQuestionAnswers || {};
        const fetchedIsQuizOver = res.data.isQuizOver ?? false;
        const fetchedUsernames = res.data.usernames || {};

        setParticipantIds(newParticipantIds);
        setUsernames(fetchedUsernames);
        setStarted(newStartedStatus);
        setIsHost(newIsHost);
        setRawParticipantIsrcs(newRawParticipantIsrcs);
        setIsGenerating(isGeneratingStatus);
        setUserScore(fetchedScores[auth.currentUser?.uid || ""] || 0);
        setAllScores(fetchedScores);
        setIsQuizOver(fetchedIsQuizOver);

        if (fetchedIsQuizOver) {
          setStarted(false);
          return;
        }

        if (newStartedStatus && fetchedQuestions.length > 0) {
          if (
            JSON.stringify(fetchedQuestions) !== JSON.stringify(quizQuestions)
          ) {
            setQuizQuestions(fetchedQuestions);
            setAreQuestionsGenerated(true);
          }

          if (fetchedCurrentQuestionIndex !== currentQuestionRef.current) {
            currentQuestionRef.current = fetchedCurrentQuestionIndex;
            setCurrentQuestionIndex(fetchedCurrentQuestionIndex);
            setSelectedOption(undefined);
            setIsLockedIn(false);
            setIsShowingScores(false);
            isShowingScoresRef.current = false;
            setUsersAnswered(Object.keys(fetchedCurrentQuestionAnswers));
            console.log("Question advanced to:", fetchedCurrentQuestionIndex);
          } else {
            setUsersAnswered(Object.keys(fetchedCurrentQuestionAnswers));
          }

          //Check if all answers are in to show scores
          if (
            !isShowingScoresRef.current &&
            fetchedQuestions.length > 0 &&
            fetchedCurrentQuestionIndex < fetchedQuestions.length &&
            Object.keys(fetchedCurrentQuestionAnswers).length ===
              newParticipantIds.length &&
            Object.keys(fetchedCurrentQuestionAnswers).length > 0 &&
            Object.keys(fetchedScores).every((uid) =>
              newParticipantIds.includes(uid)
            )
          ) {
            console.log("All participants answered, showing scores...");
            setIsShowingScores(true);
            isShowingScoresRef.current = true;
          }
        } else if (!newStartedStatus && fetchedQuestions.length === 0) {
          setAreQuestionsGenerated(false);
        }
      } catch (e) {
        console.error("Polling failed:", e);
        //Handle quiz session termination by host
        if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          (e as any).code === "not-found"
        ) {
          alert("The host has ended the quiz session.");
          navigate("/quiz/multi", {
            state: { message: "The host has ended the quiz session." },
          });
        }
      }
    }, POLLING_INTERVAL);

    //Cleanup
    return () => clearInterval(interval);
  }, [quizId, quizQuestions, participantIds, navigate, usernames]);

  //Handler for user selecting an answer option
  const handleOptionSelect = (option: string) => {
    if (!isLockedIn) {
      setSelectedOption(option);
    }
  };

  //Handler for user locking in their answer
  const handleLockIn = async () => {
    if (
      !selectedOption ||
      isLockedIn ||
      !quizId ||
      auth.currentUser?.uid === null
    )
      return;

    setIsLockedIn(true);
    try {
      const res = await submitQuizAnswer({
        quizId,
        questionIndex: currentQuestionIndex,
        selectedOption: selectedOption,
      });
      if (res.data.success) {
        console.log("Answer submitted and scored.");
      } else {
        console.error("Failed to submit answer.");
      }
    } catch (e: any) {
      console.error("Error submitting answer:", e);
      setIsLockedIn(false);
    }
  };

  //Host-only handler to advance to the next question
  const handleNextQuestion = async () => {
    if (!quizId || !isHost) return;

    const nextIndex = currentQuestionIndex + 1;
    try {
      await advanceQuizQuestion({ quizId, newQuestionIndex: nextIndex });
    } catch (e: any) {
      console.error("Error advancing question:", e);
      alert("Failed to advance question.");
    }
  };

  //Host-only function to generate and store quiz questions
  const generateAndStoreAllQuestions = async () => {
    const allGeneratedQuestions: Question[] = [];

    if (Object.keys(participantIsrcMap).length === 0) {
      console.warn("No participant ISRCs available to generate questions.");
      return false;
    }

    //Iterate through participants' songs to create questions
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

    //Store the generated questions
    if (allGeneratedQuestions.length > 0) {
      try {
        await storeQuizQuestions({
          quizId: quizId!,
          questions: allGeneratedQuestions,
        });
        setQuizQuestions(allGeneratedQuestions);
        setAreQuestionsGenerated(true);
        console.log("Host successfully stored all quiz questions.");
        return true;
      } catch (e: any) {
        console.error("Host failed to store quiz questions:", e);
        return false;
      }
    } else {
      console.warn("No questions generated for the quiz.");
      return false;
    }
  };

  //Host-only handler to start the quiz
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

    try {
      //Generate questions if not already available
      if (!areQuestionsGenerated) {
        await setGeneratingQuestionsStatus({ quizId: quizId!, status: true });
        setIsGenerating(true);

        const generationSuccess = await generateAndStoreAllQuestions();
        await setGeneratingQuestionsStatus({ quizId: quizId!, status: false });
        setIsGenerating(false);

        if (!generationSuccess) {
          alert(
            "Failed to generate and store quiz questions. Cannot start quiz."
          );
          return;
        }
      }

      //Start the quiz and move to the first question
      const res = await startQuiz({ quizId });
      if (res.data.success) {
        setStarted(true);
        await advanceQuizQuestion({ quizId, newQuestionIndex: 0 });
      } else {
        alert("Failed to start quiz.");
      }
    } catch (e: any) {
      console.error("Error starting quiz:", e);
      alert(`Error starting quiz: ${e.message}`);
      setIsGenerating(false);
    }
  };

  //Host-only handler to end the quiz session
  const handleEndQuiz = async () => {
    if (!quizId) return;
    try {
      const res = await endQuiz({ quizId });
      if (res.data.success) {
        alert("Quiz ended.");
        navigate("/quiz/multi"); //Redirect to multi-quiz page
      } else {
        alert("Failed to end quiz.");
      }
    } catch (e: any) {
      alert(`Error ending quiz: ${e.message}`);
    }
  };

  //Styling
  const centerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";
  const headingPrimaryCSS = "text-3xl text-neutral";
  const headingSecondaryCSS = "text-2xl text-neutral mb-2";
  const listCSS = "text-neutral text-xl";
  const textNeutralCSS = "text-neutral";
  const textSmallCSS = "text-sm text-neutral mt-2";
  const labelCSS = "mt-4 text-neutral";
  const selectCSS = "bg-secondary";
  const divMarginTopCSS = "mt-4";
  const italicTextCSS = "italic text-neutral mt-4";

  //Calculated values for display
  const numberOfParticipants = participantIds.length;
  const totalPotentialQuestions = numberOfParticipants * numSongsPerParticipant;

  //Function to determine quiz winner(s)
  const getWinners = () => {
    if (Object.keys(allScores).length === 0) {
      return [];
    }

    let maxScore = 0;
    for (const score of Object.values(allScores)) {
      if (score > maxScore) {
        maxScore = score;
      }
    }

    const winners: string[] = [];
    for (const userId in allScores) {
      if (allScores[userId] === maxScore) {
        winners.push(usernames[userId] || "Unnamed Participant");
      }
    }
    return winners;
  };

  const winners = getWinners();
  const winnerText =
    winners.length > 1
      ? `Winners: ${winners.join(" & ")}!`
      : `Winner: ${winners[0]}!`;

  //Render loading state while questions are generated
  if (isGenerating) {
    return (
      <div className={centerCSS}>
        <LoadingAnimation message="Generating questions, this may take a while..."></LoadingAnimation>
      </div>
    );
  }

  //Render screen with final scores and winner(s)
  if (isQuizOver) {
    return (
      <div className={centerCSS}>
        <h1 className={`${headingPrimaryCSS} mb-4`}>
          Quiz Over! Final Scores:
        </h1>
        <ul className={listCSS}>
          {Object.entries(allScores)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .map(([userId, score]) => (
              <li key={userId}>
                {usernames[userId] || "Unnamed Participant"}: {score} points
              </li>
            ))}
        </ul>
        {winners.length > 0 && (
          <h2 className={`${headingSecondaryCSS} mt-4`}>{winnerText}</h2>
        )}
        {isHost && <Button onClick={handleEndQuiz}>End Quiz Session</Button>}
      </div>
    );
  }

  //MAIN RENDERING of the quiz session
  return (
    <div className={centerCSS}>
      {!started ? (
        //Lobby view before the quiz starts
        <>
          <h2 className={headingPrimaryCSS}>Participants:</h2>
          <ul className={listCSS}>
            {participantIds.map((uid) => (
              <li key={uid}>{usernames[uid] || "Unnamed Participant"}</li>
            ))}
          </ul>

          {isHost && (
            //Host controls for quiz settings and starting
            <>
              <label className={labelCSS}>
                Number of songs per participant:
                <select
                  value={numSongsPerParticipant}
                  onChange={(e) =>
                    setNumSongsPerParticipant(parseInt(e.target.value))
                  }
                  className={selectCSS}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <Button onClick={handleStartQuiz}>Start Quiz</Button>
              {numberOfParticipants > 0 && !areQuestionsGenerated && (
                <p className={textSmallCSS}>
                  Ready to generate {totalPotentialQuestions} questions.
                </p>
              )}
              {areQuestionsGenerated && (
                <p className={textSmallCSS}>
                  Questions generated and stored ({quizQuestions.length} total).
                </p>
              )}
            </>
          )}
        </>
      ) : (
        //In-quiz view once the quiz has started
        <>
          <h1 className={headingPrimaryCSS}>Quiz ID: {quizId}</h1>

          {isShowingScores && (
            //Display scores between questions
            <div className={divMarginTopCSS}>
              <h2 className={headingSecondaryCSS}>Current Scores:</h2>
              <ul className={listCSS}>
                {Object.entries(allScores)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([userId, score]) => (
                    <li key={userId}>
                      {usernames[userId] || "Unnamed Participant"}: {score}{" "}
                      points (
                      {usersAnswered.includes(userId) ? "Answered" : "Waiting"})
                    </li>
                  ))}
              </ul>
              {isHost && (
                <Button
                  onClick={handleNextQuestion}
                  className={divMarginTopCSS}
                >
                  {currentQuestionIndex + 1 < quizQuestions.length
                    ? "Next Question"
                    : "View Final Results"}
                </Button>
              )}
              {!isHost && (
                <p className={textNeutralCSS}>Waiting for host to advance...</p>
              )}
            </div>
          )}

          {!isShowingScores &&
          quizQuestions.length > 0 &&
          currentQuestionIndex < quizQuestions.length ? (
            //Display the current quiz question card
            <QuizCard
              question={quizQuestions[currentQuestionIndex]}
              selectedOption={selectedOption}
              isLockedIn={
                isLockedIn ||
                usersAnswered.includes(auth.currentUser?.uid || "")
              }
              onSelect={handleOptionSelect}
              onLockIn={handleLockIn}
              showFeedback={
                isLockedIn ||
                usersAnswered.includes(auth.currentUser?.uid || "")
              }
              score={userScore}
              totalQuestions={quizQuestions.length}
              questionNumber={currentQuestionIndex + 1}
            />
          ) : (
            //Message when no questions are loaded or showing scores
            !isShowingScores &&
            quizQuestions.length === 0 && (
              <div className={italicTextCSS}>
                Loading or no questions generated for this quiz.
              </div>
            )
          )}

          {/* Waiting for participants to answer */}
          {!isShowingScores &&
            !isHost &&
            started &&
            quizQuestions.length > 0 &&
            currentQuestionIndex < quizQuestions.length &&
            usersAnswered.length < numberOfParticipants && (
              <p className={textNeutralCSS}>
                Waiting for others to answer ({usersAnswered.length}/
                {numberOfParticipants} answered)
              </p>
            )}

          {isHost &&
            !isShowingScores &&
            started &&
            quizQuestions.length > 0 &&
            currentQuestionIndex < quizQuestions.length && (
              <p className={textNeutralCSS}>
                Waiting for participants to answer ({usersAnswered.length}/
                {numberOfParticipants} answered)
              </p>
            )}

          {isHost && <Button onClick={handleEndQuiz}>End Quiz</Button>}
        </>
      )}
    </div>
  );
}

export default QuizSession;
