import Button from "../components/Button";
import { useEffect, useState } from "react";
import { Question, TrackData } from "../types";
import { getInfoByISRC } from "../utility/song-info";
import QuizCard from "../components/QuizCard";
import { generateQuestions } from "../utility/question-generator";
import LoadingAnimation from "../components/LoadingAnimation";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";

const getTopTracksCallable = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

function randomPick(array: Question[], count: number): Question[] {
  const questionsToPick = Math.min(count, array.length);
  return [...array].sort(() => 0.5 - Math.random()).slice(0, questionsToPick);
}

function shuffle(array: Question[]): Question[] {
  return [...array].sort(() => 0.5 - Math.random());
}

function QuizSingle() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isrcsFromTopTracks, setIsrcsFromTopTracks] = useState<string[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [numSongsToUse, setNumSongsToUse] = useState(1);

  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>();
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function fetchUserTopTracks() {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;

      if (!userId) {
        console.error("User not logged in. Cannot fetch top tracks.");
        setIsLoading(false);
        return;
      }

      try {
        const topTracksRes = await getTopTracksCallable({
          userId,
          timeRange: "short_term",
        });
        const tracks = topTracksRes.data.topTracks;

        if (tracks.length === 0) {
          console.warn("No top tracks found for the user.");
          setIsLoading(false);
          return;
        }

        const extractedIsrcs = tracks.filter((t) => t.isrc).map((t) => t.isrc!);

        setIsrcsFromTopTracks(extractedIsrcs);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching top tracks:", error);
        setIsLoading(false);
      }
    }
    fetchUserTopTracks();
  }, []);

  const handleStartQuiz = async () => {
    setIsLoading(true);
    setQuizStarted(true);

    const selectedIsrcs = [...isrcsFromTopTracks]
      .sort(() => 0.5 - Math.random())
      .slice(0, numSongsToUse);

    if (selectedIsrcs.length === 0) {
      console.warn("No ISRCs available for selected number of songs.");
      setIsLoading(false);
      setQuizStarted(false);
      return;
    }

    const finalQuestions: Question[] = [];
    for (const isrc of selectedIsrcs) {
      try {
        const song = await getInfoByISRC(isrc);
        if (song) {
          const generated = generateQuestions(song);
          const picked = randomPick(generated, 1);
          finalQuestions.push(...picked);
        }
      } catch (error) {
        console.error(`Error generating questions for ISRC ${isrc}:`, error);
      }
    }

    if (finalQuestions.length === 0) {
      console.warn("No questions could be generated from the selected songs.");
      setIsLoading(false);
      setQuizStarted(false);
      return;
    }

    setQuestions(shuffle(finalQuestions));
    setIsLoading(false);
  };

  function handleSelect(option: string) {
    if (!isLockedIn) setSelectedOption(option);
  }

  function handleLockIn() {
    if (!selectedOption) return;
    setIsLockedIn(true);
    if (selectedOption === questions[questionNumber - 1].answer) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    setIsLockedIn(false);
    setSelectedOption(undefined);
    setQuestionNumber((n) => n + 1);
  }

  const centerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  const labelCSS = "mt-4 text-neutral";
  const selectCSS = "bg-secondary";

  if (!quizStarted) {
    if (isLoading) {
      return (
        <div className={centerCSS}>
          <LoadingAnimation></LoadingAnimation>
        </div>
      );
    }
    return (
      <div className={centerCSS}>
        <h2 className="text-3xl text-neutral mb-4">Choose Number of Songs</h2>
        <label className={labelCSS}>
          Number of songs for the quiz:
          <select
            value={numSongsToUse}
            onChange={(e) => setNumSongsToUse(parseInt(e.target.value))}
            className={selectCSS}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {isrcsFromTopTracks.length > 0 && (
          <Button onClick={handleStartQuiz}>Start Quiz</Button>
        )}
        {isrcsFromTopTracks.length === 0 && !isLoading && (
          <p className="text-neutral">No songs available for selection.</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={centerCSS}>
        <LoadingAnimation></LoadingAnimation>
      </div>
    );
  }

  if (questionNumber > questions.length) {
    return (
      <div className={centerCSS}>
        <div className="text-center text-xl font-semibold text-neutral">
          Quiz Complete! Your score: {score} / {questions.length}
        </div>
      </div>
    );
  }

  return (
    <div className={centerCSS}>
      <QuizCard
        question={questions[questionNumber - 1]}
        selectedOption={selectedOption}
        isLockedIn={isLockedIn}
        onSelect={handleSelect}
        onLockIn={handleLockIn}
        onNext={handleNext}
        showFeedback={isLockedIn}
        score={score}
        totalQuestions={questions.length}
        questionNumber={questionNumber}
      />
    </div>
  );
}

export default QuizSingle;
