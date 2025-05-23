import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { QuizSessionData, Question } from "../../src/types";

const db = admin.database();

export const createQuiz = onCall(async (req: CallableRequest) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to create a quiz."
    );
  }

  const hostUserId = req.auth.uid;

  try {
    const quizRef = db.ref("quizzes").push();
    const quizId = quizRef.key;

    await db.ref(`users/${hostUserId}/hostingQuizId`).set(quizId);

    const newQuiz: QuizSessionData = {
      hostUserId,
      participants: { [hostUserId]: true },
      createdAt: Date.now(),
      started: false,
    };

    await quizRef.set(newQuiz);

    return { quizId };
  } catch (e: any) {
    throw new HttpsError("internal", "Failed to create quiz.", e.message);
  }
});

export const joinQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to join quiz."
      );
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    try {
      const quizSnapshot = await db.ref(`quizzes/${quizId}`).once("value");

      if (!quizSnapshot.exists()) {
        throw new HttpsError("not-found", "Quiz not found.");
      }

      await db.ref(`quizzes/${quizId}/participants/${userId}`).set(true);

      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to join quiz.", e.message);
    }
  }
);

export const startQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const quizSnapshot = await quizRef.once("value");

    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can start the quiz."
      );
    }

    try {
      await quizRef.update({ started: true });
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to start quiz.", e.message);
    }
  }
);

export const endQuiz = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const userId = req.auth.uid;
    const { quizId } = req.data;

    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    const quizRef = db.ref(`quizzes/${quizId}`);

    const quizSnapshot = await quizRef.once("value");

    if (!quizSnapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    const quizData = quizSnapshot.val();

    if (quizData.hostUserId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Only the host can end the quiz."
      );
    }

    try {
      await quizRef.remove();
      await db.ref(`users/${userId}/hostingQuizId`).remove();
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to end quiz.", e.message);
    }
  }
);

export const getQuizState = onCall(
  async (req: CallableRequest<{ quizId: string }>) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { quizId } = req.data;
    if (!quizId || typeof quizId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid quizId.");
    }

    try {
      const quizSnapshot = await db.ref(`quizzes/${quizId}`).once("value");

      if (!quizSnapshot.exists()) {
        throw new HttpsError("not-found", "Quiz not found.");
      }

      const quizData = quizSnapshot.val();
      const participantIds = quizData.participants
        ? Object.keys(quizData.participants)
        : [];

      return {
        participants: participantIds,
        started: quizData.started ?? false,
        isrcs: quizData.isrcs ?? {},
        questions: quizData.questions ?? {},
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

export const setParticipantIsrc = onCall(
  async (
    req: CallableRequest<{ quizId: string; userId: string; isrcs: string[] }>
  ) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { quizId, userId, isrcs } = req.data;

    if (!quizId || !userId || !Array.isArray(isrcs) || isrcs.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId, userId, or valid isrcs array."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const snapshot = await quizRef.once("value");

    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    try {
      await quizRef.child(`isrcs/${userId}`).set(isrcs);
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to store ISRC.", e.message);
    }
  }
);

export const storeQuestions = onCall(
  async (
    req: CallableRequest<{
      quizId: string;
      userId: string;
      questions: Question[];
    }>
  ) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { quizId, userId, questions } = req.data;

    if (!quizId || !userId || !Array.isArray(questions)) {
      throw new HttpsError(
        "invalid-argument",
        "Missing quizId, userId, or valid questions array."
      );
    }

    const quizRef = db.ref(`quizzes/${quizId}`);
    const snapshot = await quizRef.once("value");

    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Quiz not found.");
    }

    try {
      await quizRef.child(`questions/${userId}`).set(questions);
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to store questions.", e.message);
    }
  }
);
