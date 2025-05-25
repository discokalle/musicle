import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { QuizSessionData, Question } from "../../src/types";

//Init
const db = admin.database();

//create a new quiz
export const createQuiz = onCall(async (req: CallableRequest) => {
  //Ensure the user is authenticated
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to create a quiz."
    );
  }

  const hostUserId = req.auth.uid;

  try {
    //Create a new quiz entry in the database
    const quizRef = db.ref("quizzes").push();
    const quizId = quizRef.key;

    //Link the host to this quiz
    await db.ref(`users/${hostUserId}/hostingQuizId`).set(quizId);

    const newQuiz: QuizSessionData = {
      hostUserId,
      participants: { [hostUserId]: true },
      createdAt: Date.now(),
      started: false,
      isGeneratingQuestions: false,
    };

    //Set the initial quiz data
    await quizRef.set(newQuiz);

    return { quizId };
  } catch (e: any) {
    throw new HttpsError("internal", "Failed to create quiz.", e.message);
  }
});
//join an existing quiz
export const joinQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to join quiz."
      );
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    //Validate the quiz ID
    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    try {
      const quizSnapshot = await db.ref(`quizzes/${quizId}`).once("value");

      //Check if the quiz exists
      if (!quizSnapshot.exists()) {
        throw new HttpsError("not-found", "Quiz not found.");
      }

      //Add the user to the quiz's participants
      await db.ref(`quizzes/${quizId}/participants/${userId}`).set(true);

      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to join quiz.", e.message);
    }
  }
);

//start the quiz
export const startQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    //Validate the quiz ID
    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const quizSnapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    //Ensure only the host can start the quiz
    //Old logic, other users no longer render start button etc.
    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can start the quiz."
      );
    }

    try {
      const initialScores: Record<string, number> = {};
      const participants = quizData.participants
        ? Object.keys(quizData.participants)
        : [];

      //Init scoresfor all participants to 0.
      participants.forEach((pId: string) => {
        if (quizData.scores?.[pId] === undefined) {
          initialScores[pId] = 0;
        }
      });

      //Update the quiz status to started and set initial scores
      const updates: Record<string, any> = { started: true };
      if (Object.keys(initialScores).length > 0) {
        updates.scores = { ...(quizData.scores || {}), ...initialScores };
      }

      await quizRef.update(updates);

      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to start quiz.", e.message);
    }
  }
);

//end the quiz
export const endQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    //Validate the quiz ID
    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    const quizRef = db.ref(`quizzes/${quizId}`);

    const quizSnapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    //Ensure only the host can end the quiz
    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can end the quiz."
      );
    }

    try {
      //Remove the quiz data and host's quiz ID
      await quizRef.remove();
      await db.ref(`users/${userId}/hostingQuizId`).remove();
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to end quiz.", e.message);
    }
  }
);

//get current state of quiz
export const getQuizState = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { quizId } = req.data;
    //Validate the quiz ID
    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    try {
      const quizSnapshot = await db.ref(`quizzes/${quizId}`).once("value");

      //Check if the quiz exists
      if (!quizSnapshot.exists()) {
        throw new HttpsError("not-found", "Quiz not found.");
      }

      const quizData = quizSnapshot.val();
      const participantIds = quizData.participants
        ? Object.keys(quizData.participants)
        : [];

      //Fetch usernames for all participants
      const usernames: Record<string, string> = {};
      for (const pId of participantIds) {
        const usernameSnapshot = await db
          .ref(`users/${pId}/username`)
          .once("value");
        usernames[pId] = usernameSnapshot.val() || "Unknown User";
      }

      //Convert questions object to an array
      const questionsArray: Question[] = quizData.questions
        ? Object.values(quizData.questions)
        : [];

      const currentQuestionIndex = quizData.currentQuestionIndex ?? 0;
      const currentQuestionAnswers =
        quizData.answers?.[currentQuestionIndex] || {};
      const scores = quizData.scores || {};

      //Return quiz state
      return {
        participants: participantIds,
        usernames: usernames,
        started: quizData.started ?? false,
        isrcs: quizData.isrcs ?? {},
        questions: questionsArray,
        hostUserId: quizData.hostUserId,
        isGeneratingQuestions: quizData.isGeneratingQuestions ?? false,
        currentQuestionIndex: currentQuestionIndex,
        currentQuestionAnswers: currentQuestionAnswers,
        scores: scores,
        isQuizOver: quizData.isQuizOver ?? false,
      };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to fetch quiz state.",
        e.message
      );
    }
  }
);

//set ISRCs used to get song info and questions
export const setParticipantIsrc = onCall(
  async (
    req: CallableRequest<{ quizId: string; userId: string; isrcs: string[] }>
  ) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { quizId, userId, isrcs } = req.data;

    //Validate input data
    if (!quizId || !userId || !Array.isArray(isrcs) || isrcs.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId, userId, or valid isrcs array."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const snapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = snapshot.val();
    //Ensure only the host or a participant can set ISRCs for consistency.
    if (
      quizData.hostUserId !== req.auth.uid &&
      !quizData.participants?.[req.auth.uid]
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only host or participant can set ISRC."
      );
    }

    try {
      //Store the participants ISRCs
      await quizRef.child(`isrcs/${userId}`).set(isrcs);
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to store ISRC.", e.message);
    }
  }
);

//store the generated quiz questions
export const storeQuizQuestions = onCall(
  async (req: CallableRequest<{ quizId: string; questions: Question[] }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId, questions } = req.data;

    //Validate input data
    if (!quizId || !Array.isArray(questions)) {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId or valid questions array."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const snapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = snapshot.val();

    //Ensure only the host can store questions
    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can store quiz questions."
      );
    }

    try {
      //Store the questions under the quiz
      await quizRef.child(`questions`).set(questions);
      return { success: true };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to store quiz questions.",
        e.message
      );
    }
  }
);

//update the status of question generation
export const setGeneratingQuestionsStatus = onCall(
  async (req: CallableRequest<{ quizId: string; status: boolean }>) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId, status } = req.data;

    //Validate input data
    if (!quizId || typeof status !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId or invalid status."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const snapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = snapshot.val();

    //Ensure only the host can change this status
    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can set the question generation status."
      );
    }

    try {
      //update isGeneratingQuestions
      await quizRef.update({ isGeneratingQuestions: status });
      return { success: true };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to set generating questions status.",
        e.message
      );
    }
  }
);

//submit answer
export const submitQuizAnswer = onCall(
  async (
    req: CallableRequest<{
      quizId: string;
      questionIndex: number;
      selectedOption: string;
    }>
  ) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId, questionIndex, selectedOption } = req.data;

    //Validate input data
    if (
      !quizId ||
      typeof questionIndex !== "number" ||
      typeof selectedOption !== "string"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId, questionIndex, or selectedOption."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const quizSnapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    const questions: Question[] = quizData.questions
      ? Object.values(quizData.questions)
      : [];
    const currentQuestion = questions[questionIndex];

    //Check if the question exists
    if (!currentQuestion) {
      throw new HttpsError("not-found", "Question not found.");
    }

    const isCorrect = currentQuestion.answer === selectedOption;

    try {
      //Store the participant's answer
      await quizRef
        .child(`answers/${questionIndex}/${userId}`)
        .set(selectedOption);

      //point if answer is correct
      if (isCorrect) {
        await quizRef.child(`scores/${userId}`).transaction((currentScore) => {
          return (currentScore || 0) + 1;
        });
      }

      return { success: true, isCorrect };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to submit answer.", e.message);
    }
  }
);

//advance the quiz to the next question
export const advanceQuizQuestion = onCall(
  async (
    req: CallableRequest<{ quizId: string; newQuestionIndex: number }>
  ) => {
    //Ensure the user is authenticated
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId, newQuestionIndex } = req.data;

    //Validate input data
    if (!quizId || typeof newQuestionIndex !== "number") {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId or newQuestionIndex."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const quizSnapshot = await quizRef.once("value");

    //Check if the quiz exists
    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    //Ensure only the host can advance questions
    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can advance the quiz question."
      );
    }

    try {
      const questions: Question[] = quizData.questions
        ? Object.values(quizData.questions)
        : [];

      //If all questions are done, mark the quiz as over
      if (newQuestionIndex >= questions.length) {
        await quizRef.update({
          started: false,
          isQuizOver: true, //its jover
        });
      } else {
        //if not over, advance to the next question
        await quizRef.update({ currentQuestionIndex: newQuestionIndex });
      }
      return { success: true };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to advance quiz question.",
        e.message
      );
    }
  }
);
