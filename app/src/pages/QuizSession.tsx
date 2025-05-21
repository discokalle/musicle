import { useParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const endQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "endQuiz"
);

function QuizSession() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const centerContainerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  const titleCSS =
    "text-3xl text-white text-center transition-transform duration-200 ease-in-out hover:scale-110";

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

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Quiz ID: {quizId}</h1>
      <button
        onClick={handleEndQuiz}
        className="mt-4 px-4 py-2 bg-red-600 text-neutral"
      >
        End Quiz
      </button>
    </div>
  );
}

export default QuizSession;
