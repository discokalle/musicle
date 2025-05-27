import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import axios, { Method } from "axios";
import * as admin from "firebase-admin";

import {
  spotifyClientIdVar,
  spotifyRedirectUriVar,
  spotifyClientSecretVar,
} from "./config";

const db = admin.database();

/** ACCESS & REFRESH TOKEN EXCHANGE/UPDATE *****************************/

export const exchangeSpotifyCode = onCall(
  { secrets: [spotifyClientSecretVar] },
  async (req: CallableRequest<{ code: string }>) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const code = req.data.code;
    if (!code || typeof code !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a valid 'code' argument."
      );
    }

    const userId = req.auth.uid;

    const spotifyClientId = spotifyClientIdVar.value();
    const spotifyRedirectUri = spotifyRedirectUriVar.value();
    const spotifyClientSecret = spotifyClientSecretVar.value();

    if (!spotifyClientId || !spotifyClientSecret || !spotifyRedirectUri) {
      // console.error(
      //   "Spotify configuration missing in Firebase environment variables."
      // );
      throw new HttpsError("internal", "Server configuration error.");
    }

    try {
      const tokenUrl = "https://accounts.spotify.com/api/token";

      // encode Client ID and Secret for Basic Auth header
      const authHeader = Buffer.from(
        `${spotifyClientId}:${spotifyClientSecret}`
      ).toString("base64");

      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", spotifyRedirectUri);

      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;

      if (!access_token || !refresh_token) {
        throw new Error("Failed to retrieve tokens from Spotify.");
      }

      // store the users Spotify token data
      await db.ref(`users/${userId}/spotify`).set({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      return { success: true, message: "Spotify connected successfully." };
    } catch (e: any) {
      // console.error(
      //   "Error exchanging Spotify code for user:",
      //   userId,
      //   e.response?.data || e.message || e
      // );
      throw new HttpsError(
        "internal",
        "Failed to connect Spotify account. Please try again later.",
        e.message
      );
    }
  }
);

const refreshAccessToken = async (userId: string) => {
  const spotifyClientId = spotifyClientIdVar.value();
  const spotifyClientSecret = spotifyClientSecretVar.value();

  if (!spotifyClientId || !spotifyClientSecret) {
    throw new HttpsError(
      "internal",
      "Server config error during access token refresh."
    );
  }

  const tokenSnapshot = await db
    .ref(`users/${userId}/spotify/refreshToken`)
    .once("value");
  const currRefrTok = tokenSnapshot.val();

  if (!currRefrTok) {
    await db.ref(`users/${userId}/spotify`).remove();
    throw new HttpsError("unauthenticated", "Spotify refresh token not found");
  }

  try {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const authHeader = Buffer.from(
      `${spotifyClientId}:${spotifyClientSecret}`
    ).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", currRefrTok);

    const res = await axios.post(tokenUrl, params, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const {
      access_token: newAccessToken,
      expires_in: newExpiresIn,
      refresh_token: newRefreshToken,
    } = res.data;

    if (!newAccessToken) {
      throw new Error("No new access token returned by Spotify upon refresh.");
    }

    const updates: {
      accessToken: string;
      expiresAt: number;
      refreshToken?: string;
    } = {
      accessToken: newAccessToken,
      expiresAt: Date.now() + newExpiresIn * 1000,
    };

    if (newRefreshToken) {
      updates.refreshToken = newRefreshToken;
    }

    await db.ref(`users/${userId}/spotify`).update(updates);
    // console.log(`Successfully refreshed token for user: ${userId}`);
    return newAccessToken;
  } catch (e: any) {
    // console.error(
    //   "Error during Spotify token refresh",
    //   userId,
    //   e.response?.data || e.message
    // );
    if (e.response?.data?.error === "invalid_grant") {
      await db.ref(`users/${userId}/spotify`).remove();
      throw new HttpsError(
        "unauthenticated",
        "Spotify refresh token invalid. Please reconnect."
      );
    }
    throw new HttpsError(
      "internal",
      "Error during Spotify token refresh.",
      e.message
    );
  }
};

/** SPOTIFY API CALL *******************************************/

export const callSpotifyApi = async ({
  endpoint,
  userId,
  method = "GET",
  queryParams,
  bodyData,
}: {
  endpoint: string;
  userId: string;
  method: string;
  queryParams?: any;
  bodyData?: any;
}) => {
  // in a joint session (e.g., queue) where the host has granted other
  // participants access to queue songs etc., a targetUserId may be
  // provided to the API call to allow these participants to make calls
  // on behalf of the host (under the assumption that the auth of the
  // non-host user has been done prior to calling this function)

  // this would probably require the host to explicitly accept these
  // conditions, but for the sake of the app here, I figured that we
  // can make the assumption that this has been done by the sample user

  if (!endpoint || typeof endpoint !== "string") {
    throw new HttpsError("invalid-argument", "Invalid 'endpoint' parameter");
  }
  if (!method || typeof method !== "string") {
    throw new HttpsError("invalid-argument", "Invalid 'method' parameter");
  }
  if (!userId || typeof userId !== "string") {
    throw new HttpsError("invalid-argument", "Invalid 'userId' parameter");
  }

  try {
    const spotifyDataRef = db.ref(`users/${userId}/spotify`);
    const snapshot = await spotifyDataRef.once("value");
    const spotifyData = snapshot.val();

    if (!spotifyData || !spotifyData.accessToken || !spotifyData.expiresAt) {
      throw new HttpsError(
        "failed-precondition",
        "Spotify not connected, or incomplete user token data"
      );
    }

    let currAccTok = spotifyData.accessToken;
    const expiresAt = spotifyData.expiresAt;
    const bufferTime = 5 * 60 * 1000; // 5 min buffer to refresh token with a margin

    if (Date.now() >= expiresAt - bufferTime) {
      currAccTok = await refreshAccessToken(userId);
    }

    const spotifyApiUrl = `https://api.spotify.com${
      endpoint.startsWith("/") ? "" : "/"
    }${endpoint}`;

    const res = await axios({
      method: method as Method,
      url: spotifyApiUrl,
      headers: {
        Authorization: `Bearer ${currAccTok}`,
        "Content-Type": "application/json",
      },
      params: queryParams,
      data: bodyData,
    });

    return res.data;
  } catch (e: any) {
    if (e instanceof HttpsError) {
      throw e;
    }

    throw new HttpsError("internal", "Failed to call Spotify API", e.message);
  }
};
