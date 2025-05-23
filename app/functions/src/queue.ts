import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { callSpotifyApi } from "./spotify";

import { TrackData, SessionData, QueueItemData } from "../../src/types";

const db = admin.database();

/** SPOTIFY DEVICE SETUP *************************************************/

export const getActiveSpotifyDevices = onCall(async (req: CallableRequest) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to get Spotify devices."
    );
  }

  const userId = req.auth.uid;

  try {
    const res = await callSpotifyApi({
      endpoint: "/v1/me/player/devices",
      method: "GET",
      userId: userId,
    });

    if (!res || !res.devices) {
      throw new HttpsError(
        "internal",
        "Failed to retrieve devices or devices list is empty."
      );
    }

    return { devices: res.devices };
  } catch (e: any) {
    if (e instanceof HttpsError) throw e;

    throw new HttpsError(
      "internal",
      "Failed to get Spotify devices.",
      e.message
    );
  }
});

export const setSpotifyDevice = onCall(
  async (
    req: CallableRequest<{
      sessionId: string;
      deviceId: string;
      deviceName: string;
    }>
  ) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to set host device."
      );
    }

    const hostUserId = req.auth.uid;
    const { sessionId, deviceId, deviceName } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
    }
    if (!deviceId || typeof deviceId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid deviceId.");
    }
    if (!deviceName || typeof deviceName !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid deviceName."
      );
    }

    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");

      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError(
          "permission-denied",
          "Only the host can set the device for the session."
        );
      }

      await sessionRef.update({ deviceId: deviceId, deviceName: deviceName });
      return { success: true, message: "Spotify device set successfully." };
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError("internal", "Failed to set host device.", e.message);
    }
  }
);

/** CREATE/JOIN SESSION ************************************************/

export const createSession = onCall(async (req: CallableRequest) => {
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
    const sessionRef = db.ref("sessions").push();
    const sessionId = sessionRef.key;

    await db.ref(`users/${hostUserId}/hostingSessionId`).set(sessionId);

    await sessionRef.set({
      hostUserId: hostUserId,
      participants: {
        [hostUserId]: true,
      },
      queue: {},
      createdAt: Date.now(),
    } as SessionData);

    console.log(`Session created: ${sessionId} by host: ${hostUserId}`);

    return { sessionId: sessionId };
  } catch (e: any) {
    throw new HttpsError("internal", "Failed to create session.", e.message);
  }
});

export const joinSession = onCall(
  async (req: CallableRequest<{ sessionId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to join a session."
      );
    }

    const userId = req.auth.uid;
    const { sessionId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
    }

    try {
      const sessionSnapshot = await db
        .ref(`sessions/${sessionId}`)
        .once("value");
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
  }
);

/** SEARCH, ENQUEUE & VOTE FOR TRACKS ***********************************/

export const searchSpotifyTracks = onCall(
  async (req: CallableRequest<{ sessionId: string; query: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to search for tracks."
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
      const sessionSnapshot = await db
        .ref(`sessions/${sessionId}`)
        .once("value");
      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (
        !sessionData.participants ||
        !sessionData.participants[callerUserId]
      ) {
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

      const searchResults = await callSpotifyApi({
        endpoint: "/v1/search",
        method: "GET",
        userId: hostUserId,
        queryParams: {
          q: query,
          type: "track",
          limit: 5 + 1,
        },
      });

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
          isrc: item.external_ids.isrc,
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
  }
);

export const addTrackToQueue = onCall(
  async (req: CallableRequest<{ sessionId: string; trackData: TrackData }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to add track to queue."
      );
    }
    const suggesterUid = req.auth.uid;

    const { sessionId, trackData } = req.data;
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
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid artistName."
      );
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
      } as QueueItemData);

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
  }
);

export const voteForTrack = onCall(
  async (req: CallableRequest<{ sessionId: string; queueItemId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to vote for track."
      );
    }
    const voterUid = req.auth.uid;

    const { sessionId, queueItemId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessionId.");
    }
    if (!queueItemId || typeof queueItemId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid queueItemId."
      );
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
  }
);

/** SPOTIFY QUEUE SETUP FOR SESSION ***********************************/

export const skipCurrentTrack = onCall(
  async (req: CallableRequest<{ sessionId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to play next track."
      );
    }
    const hostUserId = req.auth.uid;
    const { sessionId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessiondId");
    }
    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");

      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError("permission-denied", "Only the host skip tracks.");
      }
      if (sessionData.isEnded) {
        throw new HttpsError(
          "failed-precondition",
          "The session has already ended."
        );
      }
      if (!sessionData.deviceId) {
        throw new HttpsError(
          "failed-precondition",
          "The session has not connected to a Spotify device."
        );
      }
      await callSpotifyApi({
        endpoint: "/v1/me/player/next",
        method: "POST",
        userId: hostUserId,
        queryParams: {
          device_id: sessionData.deviceId,
        },
      });
      return {
        success: true,
        message: "The next track was successfully skipped.",
      };
    } catch (e: any) {
      if (e instanceof HttpsError) {
        throw e;
      }
      throw new HttpsError("internal", "Failed to skip track.", e.message);
    }
  }
);

// changes the playback state
// `play` = true starts/resumes playback, false pauses playback
export const changePlaybackState = onCall(
  async (req: CallableRequest<{ sessionId: string; play: boolean }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to play next track."
      );
    }
    const hostUserId = req.auth.uid;
    const { sessionId, play } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessiondId");
    }
    if (typeof play !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid play parameter"
      );
    }

    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");

      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError(
          "permission-denied",
          "Only the host can control playback."
        );
      }
      if (sessionData.isEnded) {
        throw new HttpsError(
          "failed-precondition",
          "The session has already ended."
        );
      }
      if (!sessionData.deviceId) {
        throw new HttpsError(
          "failed-precondition",
          "The session has not connected to a Spotify device."
        );
      }
      await callSpotifyApi({
        endpoint: `v1/me/player/${play ? "play" : "pause"}`,
        method: "PUT",
        userId: hostUserId,
        queryParams: {
          device_id: sessionData.deviceId,
        },
      });
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to change Spotify playback",
        e.message
      );
    }
  }
);

// Returns not only the items that are enqueued manually, but also items that follow in a playlist or
// that Spotify recommends... So this cannot be used to detect the length of the actual queue! :(
/**
export const getSpotifyQueue = onCall(
  async (req: CallableRequest<{ sessionId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to play next track."
      );
    }
    const hostUserId = req.auth.uid;
    const { sessionId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessiondId");
    }
    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");

      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError(
          "permission-denied",
          "Only the host can control playback."
        );
      }
      if (sessionData.isEnded) {
        throw new HttpsError(
          "failed-precondition",
          "The session has already ended."
        );
      }
      if (!sessionData.deviceId) {
        throw new HttpsError(
          "failed-precondition",
          "The session has not connected to a Spotify device."
        );
      }

      return {
        queue: await callSpotifyApi({
          endpoint: `v1/me/player/queue`,
          method: "GET",
          userId: hostUserId,
        }),
      };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        "Failed to clear Spotify queue.",
        e.message
      );
    }
  }
);
*/

/**
export const clearQueueOnSpotify = onCall(
  async (req: CallableRequest<{ sessionId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to play next track."
      );
    }
    const hostUserId = req.auth.uid;
    const { sessionId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessiondId");
    }
    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");

      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError(
          "permission-denied",
          "Only the host can control playback."
        );
      }
      if (sessionData.isEnded) {
        throw new HttpsError(
          "failed-precondition",
          "The session has already ended."
        );
      }
      if (!sessionData.deviceId) {
        throw new HttpsError(
          "failed-precondition",
          "The session has not connected to a Spotify device."
        );
      }

      const res = await callSpotifyApi({
        endpoint: `v1/me/player/queue`,
        method: "GET",
        userId: hostUserId,
      });

      console.log(res.data.queue);

      const numSkips =
        res.data.queue.length + res.data.currentlyPlaying ? 1 : 0;
      for (let i = 0; i < numSkips; ++i) {
          await callSpotifyApi({
            endpoint: "/v1/me/player/next",
            method: "POST",
            userId: hostUserId,
            queryParams: {
              device_id: deviceId,
            },
          });
      }

      return {
        success: true,
        message: "Spotify queue was successfully cleared.",
      };
    } catch (e: any) {
      if (e instanceof HttpsError) {
        throw e;
      }
      throw new HttpsError(
        "internal",
        "Failed to clear Spotify queue.",
        e.message
      );
    }
  }
);
*/

/** PLAY NEXT TRACK IN QUEUE **************************************/

export const getSpotifyPlaybackState = onCall(async (req: CallableRequest) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to get playback state."
    );
  }

  const userId = req.auth.uid;

  try {
    const res = await callSpotifyApi({
      endpoint: "/v1/me/player",
      method: "GET",
      userId: userId,
    });

    return { playbackState: res };
  } catch (e: any) {
    throw new HttpsError(
      "internal",
      "Failed to get playback state.",
      e.message
    );
  }
});

export const playNextTrack = onCall(
  async (req: CallableRequest<{ sessionId: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to play next track."
      );
    }

    const hostUserId = req.auth.uid;
    const { sessionId } = req.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid sessiondId");
    }

    try {
      const sessionRef = db.ref(`sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.once("value");
      if (!sessionSnapshot.exists()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionSnapshot.val();
      if (sessionData.hostUserId !== hostUserId) {
        throw new HttpsError(
          "permission-denied",
          "Only the host can control playback."
        );
      }

      if (sessionData.isEnded) {
        throw new HttpsError(
          "failed-precondition",
          "The session has already ended."
        );
      }

      if (!sessionData.deviceId) {
        throw new HttpsError(
          "failed-precondition",
          "The session has not connected to a Spotify device."
        );
      }

      const queueSnapshot = await sessionRef.child("queue").once("value");
      const queue: Record<string, QueueItemData> = queueSnapshot.val();

      if (!queue || Object.keys(queue).length === 0) {
        return { success: true, message: "Queue is empty." };
      }

      const [nextTrackId, nextTrack] = Object.entries(queue).sort(
        ([, a], [, b]) => b.voteCount - a.voteCount
      )[0];

      if (!nextTrack || !nextTrack.track || !nextTrack.track.uri) {
        console.error("Next track or track URI is invalid.", nextTrack);
        throw new HttpsError(
          "internal",
          "Could not determine a valid next track from the queue."
        );
      }

      await callSpotifyApi({
        endpoint: "/v1/me/player/play",
        method: "PUT",
        userId: hostUserId,
        queryParams: {
          device_id: sessionData.deviceId,
        },
        bodyData: {
          uris: [nextTrack.track.uri],
        },
      });

      await sessionRef.child(`queue/${nextTrackId}`).remove();

      return {
        success: true,
        message: `Playing next track: ${nextTrack.track.name}`,
        playedTrackData: nextTrack.track,
      };
    } catch (e: any) {
      if (e instanceof HttpsError) {
        throw e;
      }
      throw new HttpsError(
        "internal",
        "Failed to play the next track.",
        e.message
      );
    }
  }
);
