import type { Question } from "../types";

type Props = {
  question: Question;
  selectedOption?: string;
  isLockedIn: boolean;
  onSelect: (option: string) => void;
  onLockIn: () => void;
  onNext?: () => void;
  showFeedback?: boolean;
  score: number;
  totalQuestions: number;
  questionNumber: number;
};

function QuizCard({
  question,
  selectedOption,
  isLockedIn,
  onSelect,
  onLockIn,
  onNext,
  showFeedback = true,
  score,
  totalQuestions,
  questionNumber,
}: Props) {
  const cardCSS = "p-4 rounded max-w-md mx-auto mt-8 bg-secondary";
  const scoreCSS = "text-neutral text-right mb-2 font-semibold";
  const questionCSS = "text-neutral text-lg font-bold mb-4";
  const wrapperCSS = "flex flex-col gap-2";
  const optionDefaultCSS =
    "py-2 px-4 rounded border-2 w-full font-bold text-neutral text-left bg-primary border-accent hover:bg-accent hover:text-primary";
  const optionSelectedCSS =
    "py-2 px-4 rounded border-2 w-full font-bold text-primary text-left bg-accent border-primary";
  const optionCorrectCSS =
    "py-2 px-4 rounded border-2 w-full font-bold text-neutral text-left bg-green-500 border-green-700";
  const optionIncorrectCSS =
    "py-2 px-4 rounded border-2 w-full font-bold text-neutral text-left bg-red-500 border-red-700";
  const buttonsContainerCSS = "mt-6 flex flex-col gap-3 w-full";
  const buttonEnabledCSS =
    "py-2 px-4 rounded w-full font-bold text-accent bg-primary hover:bg-accent hover:text-primary cursor-pointer";
  const buttonDisabledCSS =
    "py-2 px-4 rounded w-full font-bold text-neutral bg-primary opacity-25 cursor-not-allowed";
  const feedbackContainerCSS =
    "text-xl font-bold text-center mt-4 min-h-[1.5rem]";
  const feedbackCorrectCSS = "text-green-600";
  const feedbackIncorrectCSS = "text-red-600";
  const placeholderCSS = "invisible";

  function getOptionClass(opt: string): string {
    if (!isLockedIn) {
      return selectedOption === opt ? optionSelectedCSS : optionDefaultCSS;
    }
    if (opt === question.answer) {
      return optionCorrectCSS;
    }
    if (opt === selectedOption) {
      return optionIncorrectCSS;
    }
    return optionDefaultCSS;
  }

  return (
    <div className={cardCSS}>
      <div className={scoreCSS}>
        Question {questionNumber}/{totalQuestions} | Score: {score}
      </div>
      <h2 className={questionCSS}>{question.question}</h2>
      <div className={wrapperCSS}>
        {question.options.map((opt) => (
          <button
            key={opt}
            disabled={isLockedIn}
            onClick={() => onSelect(opt)}
            className={getOptionClass(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className={buttonsContainerCSS}>
        <button
          onClick={onLockIn}
          disabled={!selectedOption || isLockedIn}
          className={
            !selectedOption || isLockedIn ? buttonDisabledCSS : buttonEnabledCSS
          }
        >
          Lock In
        </button>
        {onNext && (
          <button
            onClick={onNext}
            disabled={!isLockedIn}
            className={isLockedIn ? buttonEnabledCSS : buttonDisabledCSS}
          >
            Continue
          </button>
        )}
      </div>
      <div className={feedbackContainerCSS}>
        {isLockedIn && selectedOption && showFeedback ? (
          selectedOption === question.answer ? (
            <span className={feedbackCorrectCSS}>Correct!</span>
          ) : (
            <span className={feedbackIncorrectCSS}>Wrong!</span>
          )
        ) : (
          <span className={placeholderCSS}>Feedback</span>
        )}
      </div>
    </div>
  );
}

export default QuizCard;
