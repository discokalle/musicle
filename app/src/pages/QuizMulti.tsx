//Will create a similar style for creating and joining multi quizes like the code below (ripped from Queue.tsx):

import Button from "../components/Button";

import { useLocation, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";

import { auth, db, functions } from "../firebase";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";

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

    // handles alert passed from QuizSession (e.g., to alert the user that
    // the host ended the session)
    if (location.state?.message) {
      // alert w/ small delay to allow re-navigation to complete
      const timerId = setTimeout(() => {
        alert(location.state.message);
        navigate(location.pathname, { replace: true, state: {} }); // reset state to avoid re-alerting
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
      // alert("Quiz session created successfully!");
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
    return <div>Loading...</div>;
  }

  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[40%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is <span className="italic text-accent font-bold">THE QUIZ!</span>
      </h1>
      <p className="text-neutral text-xl">
        Gather your friends and compete in quizzes!
      </p>

      <div className="flex gap-10">
        <Button onClick={handleCreateQuiz}>Create Quiz</Button>
        <Button onClick={handleJoinQuiz}>Join Quiz</Button>
      </div>
    </div>
  );
}

export default QuizMulti;
