import { useState } from "react";

export type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Props = {
  questions: Question[];
};

function QuizCard({ questions }: Props) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);

  function pick(option: string) {
    if (option === questions[i].answer) setScore((prev) => prev + 1);
    setI((prev) => prev + 1);
  }

  if (i >= questions.length) {
    //done. show asnwer
    return (
      <div className="text-center text-xl font-semibold text-neutral mt-4">
        Score: {score} / {questions.length}
      </div>
    );
  }

  const q = questions[i];
  const cardCSS = "bg-secondary p-4 rounded-md shadow-md max-w-md mx-auto mt-8";
  const questionCSS = "text-lg font-bold text-neutral mb-4";
  const wrapperCSS = "flex flex-col gap-2";
  const buttonCSS =
    "bg-primary text-neutral py-2 px-4 rounded-md border-2 border-accent hover:bg-accent hover:border-primary transition";

  return (
    <div className={cardCSS}>
      <h2 className={questionCSS}>{q.question}</h2>
      <div className={wrapperCSS}>
        {q.options.map((opt) => (
          <button key={opt} onClick={() => pick(opt)} className={buttonCSS}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuizCard;
