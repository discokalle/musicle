import Button from "../components/Button";

import { useLocation, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";

import { auth, db, functions } from "../firebase";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";

import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";
import LoadingAnimation from "../components/LoadingAnimation";

const createQuiz = httpsCallable<{}, { quizId: string }>(
  functions,
  "createQuiz"
);
const joinQuiz = httpsCallable<{ quizId: string }, { success: boolean }>(
  functions,
  "joinQuiz"
);

function QuizMulti() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (location.state?.message) {
      const timerId = setTimeout(() => {
        alert(location.state.message);
        navigate(location.pathname, { replace: true, state: {} });
      }, 50);

      return () => clearTimeout(timerId);
    }

    const handleIfUserIsHostingQuiz = async () => {
      try {
        const snapshot = await get(
          ref(db, `users/${auth.currentUser?.uid}/hostingQuizId`)
        );

        if (snapshot.exists()) {
          navigate(snapshot.val());
        }
      } catch (e: any) {
        console.log("Error:", e.message);
      } finally {
        setIsLoading(false);
      }
    };

    handleIfUserIsHostingQuiz();
  }, [location.state?.message, navigate]);

  const handleCreateQuiz = async () => {
    try {
      const res = await createQuiz();
      if (!res) {
        alert("Failed to create Quiz.");
        return;
      }

      const quizId = res.data.quizId;
      navigate(quizId);
    } catch (e: any) {
      console.log(e.code, e.message);
    }
  };

  const handleJoinQuiz = async () => {
    const quizIdInput = window.prompt("Please enter the Quiz ID to join:");

    if (quizIdInput === null || quizIdInput.trim() === "") {
      return;
    }

    try {
      const res = await joinQuiz({ quizId: quizIdInput });
      if (!res || !res.data?.success) {
        alert("Failed to join Quiz.");
        return;
      }

      navigate(quizIdInput);
    } catch (e: any) {
      alert(`An error occurred while attempting to connect: ${e.message}`);
    }
  };

  if (isLoading) {
    return <LoadingAnimation></LoadingAnimation>;
  }

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is{" "}
        <span className="italic text-accent font-bold">
          THE MULTIPLAYER QUIZ!
        </span>
      </h1>
      <p className={subtitleCSS}>
        Gather your friends and compete in quizzes tailored to everyone's music
        taste!
      </p>

      <div className="flex gap-10">
        <Button onClick={handleCreateQuiz} size="large">
          Create Quiz
        </Button>
        <Button onClick={handleJoinQuiz} size="large">
          Join Quiz
        </Button>
      </div>
    </div>
  );
}

export default QuizMulti;
