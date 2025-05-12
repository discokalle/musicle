import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { _callSpotifyApi } from "./spotify";

import { TrackData } from "../../src/types";

// import {
//   spotifyClientIdVar,
//   spotifyRedirectUriVar,
//   spotifyClientSecretVar,
// } from "./config";

const db = admin.database();

export const createSession = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to create a session."
    );
  }
  const hostUserId = req.auth.uid;

  const spotifyCheck = await db
    .ref(`users/${hostUserId}/spotify`)
    .once("value");

  if (!spotifyCheck.exists()) {
    throw new HttpsError(
      "failed-precondition",
      "Host must have Spotify connected."
    );
  }

  try {
    // console.log("SERVER: entered try");
    const sessionRef = db.ref("sessions").push();
    // console.log("SERVER: sessionRef", sessionRef);
    const sessionId = sessionRef.key;
    // console.log("SERVER: sessionId", sessionId);
    // console.log("SERVER: hostUserId", hostUserId);
    // console.log("SERVER: createdAt", Date.now());

    await db.ref(`users/${hostUserId}/hostingSessionId`).set(sessionId);

    await sessionRef.set({
      hostUserId: hostUserId,
      // createdAt: admin.database.ServerValue.TIMESTAMP,
      createdAt: Date.now(),
      participants: {
        [hostUserId]: true,
      },
      queue: {},
    });

    console.log(`Session created: ${sessionId} by host: ${hostUserId}`);

    return { sessionId: sessionId };
  } catch (e: any) {
    throw new HttpsError("internal", "Failed to create session.", e.message);
  }
});

export const joinSession = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to join a session."
    );
  }

  const userId = req.auth.uid;
  const sessionId = req.data.sessionId;

  if (!sessionId || typeof sessionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
  }

  try {
    const sessionSnapshot = await db.ref(`sessions/${sessionId}`).once("value");
    if (!sessionSnapshot.exists()) {
      throw new HttpsError("not-found", "Session not found.");
    }

    await db.ref(`sessions/${sessionId}/participants/${userId}`).set(true);

    console.log(`User ${userId} joined session ${sessionId}`);

    return { success: true };
  } catch (e: any) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError("internal", "Failed to join session.", e.message);
  }
});

export const searchSpotifyTracks = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to search tracks."
    );
  }

  const callerUserId = req.auth.uid;
  const { sessionId, query } = req.data;

  if (!sessionId || typeof sessionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
  }
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid search query."
    );
  }

  try {
    const sessionSnapshot = await db.ref(`sessions/${sessionId}`).once("value");
    if (!sessionSnapshot.exists()) {
      throw new HttpsError("not-found", "Session not found.");
    }

    const sessionData = sessionSnapshot.val();
    if (!sessionData.participants || !sessionData.participants[callerUserId]) {
      throw new HttpsError(
        "permission-denied",
        "You are not a participant in this session."
      );
    }

    const hostUserId = sessionData.hostUserId;
    if (!hostUserId) {
      throw new HttpsError(
        "internal",
        "Session data is missing the host user ID."
      );
    }

    const searchResults = await _callSpotifyApi({
      data: {
        endpoint: "/v1/search",
        queryParams: {
          q: query,
          type: "track",
          limit: 5 + 1,
        },
        method: "GET",
        targetUserId: hostUserId,
      },
    } as CallableRequest);

    if (!searchResults || !searchResults.tracks) {
      throw new HttpsError(
        "internal",
        "Received unexpected format from Spotify search, perhaps because no match exists."
      );
    }

    const extractedTrackData = searchResults.tracks.items.map((item: any) => {
      return {
        uri: item.uri,
        name: item.name,
        artist: item.artists[0].name,
        album: item.album?.name,
        albumCoverUrl: item.album?.images?.[0]?.url,
      } as TrackData;
    });

    return { results: extractedTrackData };
  } catch (e: any) {
    if (e instanceof HttpsError) {
      throw e;
    }

    throw new HttpsError(
      "internal",
      "Failed to search Spotify tracks.",
      e.message
    );
  }
});

export const addTrackToQueue = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const suggesterUid = req.auth.uid;

  const sessionId: string = req.data.sessionId;
  const trackData: TrackData = req.data.trackData;

  // console.log(sessionId, trackData);

  if (!sessionId || typeof sessionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
  }
  if (!trackData.uri || typeof trackData.uri !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid trackUri.");
  }
  if (!trackData.name || typeof trackData.name !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid trackName.");
  }
  if (!trackData.artist || typeof trackData.artist !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid artistName.");
  }

  try {
    const participantSnapshot = await db
      .ref(`sessions/${sessionId}/participants/${suggesterUid}`)
      .once("value");

    if (!participantSnapshot.exists()) {
      throw new HttpsError(
        "permission-denied",
        "You are not a participant in this session."
      );
    }

    const newTrackRef = db.ref(`sessions/${sessionId}/queue`).push();

    await newTrackRef.set({
      track: trackData,
      suggesterUsername: req.auth.token.name,
      votes: {},
      voteCount: 0,
      // addedAt: admin.database.ServerValue.TIMESTAMP,
      addedAt: Date.now(),
    });

    return { success: true, queueItemId: newTrackRef.key };
  } catch (e: any) {
    if (e instanceof HttpsError) {
      throw e;
    }
    throw new HttpsError(
      "internal",
      "Failed to add track to queue.",
      e.message
    );
  }
});

export const voteForTrack = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const voterUid = req.auth.uid;

  const { sessionId, queueItemId } = req.data;
  if (!sessionId || typeof sessionId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
  }
  if (!queueItemId || typeof queueItemId !== "string") {
    throw new HttpsError("invalid-argument", "Missing or invalid queueItemId.");
  }

  const trackRef = db.ref(`sessions/${sessionId}/queue/${queueItemId}`);

  try {
    const participantSnapshot = await db
      .ref(`sessions/${sessionId}/participants/${voterUid}`)
      .once("value");
    if (!participantSnapshot.exists()) {
      throw new HttpsError(
        "permission-denied",
        "You are not a participant in this session."
      );
    }

    const trackSnapshot = await trackRef.once("value");
    if (!trackSnapshot.exists()) {
      throw new HttpsError("not-found", "Track not found in the queue.");
    }

    // checks if the user has already voted, and removes vote if it has
    const transactionResult = await trackRef
      .child(`votes/${voterUid}`)
      .transaction((currentVote) => {
        if (currentVote === null) {
          return true;
        } else {
          return null;
        }
      });

    if (!transactionResult.committed) {
      throw new HttpsError(
        "internal",
        "Failed to update vote due to conflicting data."
      );
    }

    const allVotesSnapshot = await trackRef.child("votes").once("value");
    await trackRef.child("voteCount").set(allVotesSnapshot.numChildren());

    return { success: true };
  } catch (e: any) {
    if (e instanceof HttpsError) {
      throw e;
    }
    throw new HttpsError("internal", "Failed to process vote.", e.message);
  }
});

// TO-DO: implement playNextTrack() and getHostDeviceId() (to know which device is playing)
