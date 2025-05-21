import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { QuizSessionData } from "../../src/types";

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
      await quizRef.remove(); // remove the quiz session
      await db.ref(`users/${userId}/hostingQuizId`).remove(); // clear host's quiz id
      return { success: true };
    } catch (e: any) {
      throw new HttpsError("internal", "Failed to end quiz.", e.message);
    }
  }
);
