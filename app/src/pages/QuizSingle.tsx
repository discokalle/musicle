import { useEffect, useState } from "react";
import { Question } from "../types";
import { getInfoByISRC } from "../song-info";
import QuizCard from "../components/QuizCard";
import { generateQuestions } from "../question-generator";
import LoadingAnimation from "../components/LoadingAnimation";

//ISRC codes seem to be universal across services for recordings.
const ISRCs = [
  "GBN9Y1100088",
  "USSM17700373",
  /* "SEPQA2500011",
  "GBAYE0601696",
  "USUG11500737", */
];

function randomPick(array: Question[], count: number): Question[] {
  return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}

function shuffle(array: Question[]): Question[] {
  return [...array].sort(() => 0.5 - Math.random());
}

function QuizSingle() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>();
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [score, setScore] = useState(0);

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
      setIsLoading(false);
    }
    loadQuestions();
  }, []);

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
        score={score}
        totalQuestions={questions.length}
        questionNumber={questionNumber}
      />
    </div>
  );
}

export default QuizSingle;
