import { useEffect, useState } from "react";
import { getInfoByISRC } from "../song-info";
import QuizCard, { Question } from "../components/QuizCard";
import { generateQuestions } from "../question-generator";

const ISRCs = ["GBN9Y1100088", "USSM17700373"];
const countdown = 10;

function randomPick(array: Question[], count: number): Question[] {
  return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}

function shuffle(array: Question[]): Question[] {
  return [...array].sort(() => 0.5 - Math.random());
}

function QuizMulti() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>();
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [score, setScore] = useState(0);

  const [showScoreboard, setShowScoreboard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    async function loadQuestions() {
      const finalQuestions: Question[] = [];
      for (const isrc of ISRCs) {
        const song = await getInfoByISRC(isrc);
        if (song) {
          const generated = generateQuestions(song);
          const picked = randomPick(generated, 2);
          finalQuestions.push(...picked);
        }
      }
      setQuestions(shuffle(finalQuestions));
      setLoading(false);
    }
    loadQuestions();
  }, []);

  useEffect(() => {
    if (isLockedIn || showScoreboard) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isLockedIn, showScoreboard]);

  function handleTimeout() {
    setIsLockedIn(true);
  }

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
    setShowScoreboard(true);
    setTimeout(() => {
      setShowScoreboard(false);
      setIsLockedIn(false);
      setSelectedOption(undefined);
      setQuestionNumber((n) => n + 1);
      setTimeLeft(countdown);
    }, 3000);
  }

  const centerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  if (loading) {
    return (
      <div className={centerCSS}>
        <p className="text-neutral">Loading...</p>
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

  if (showScoreboard) {
    return (
      <div className={centerCSS}>
        <div className="text-center text-xl font-bold text-neutral">
          <p>Scoreboard Placeholder</p>
          <p className="mt-2">Your score: {score}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={centerCSS}>
      <div className="text-lg font-semibold text-red-600 mb-2">
        Time Left: {timeLeft}s
      </div>
      <QuizCard
        question={questions[questionNumber - 1]}
        selectedOption={selectedOption}
        isLockedIn={isLockedIn}
        onSelect={handleSelect}
        onLockIn={handleLockIn}
        onNext={handleNext}
        score={score}
        totalQuestions={questions.length}
        questionNumber={questionNumber}
      />
    </div>
  );
}

export default QuizMulti;
