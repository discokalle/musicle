import {
  onCall,
  CallableRequest,
  HttpsError,
} from "firebase-functions/v2/https";
// import * as admin from "firebase-admin";

import { callSpotifyApi } from "./spotify";
import { TrackData } from "../../src/types";

// const db = admin.database();

export const getTopTracks = onCall(
  async (req: CallableRequest<{ userId: string }>) => {
    const { userId } = req.data;

    if (!userId || typeof userId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid or missing userId.");
    }

    try {
      const res = await callSpotifyApi({
        endpoint: "/v1/me/top/tracks",
        method: "GET",
        queryParams: {
          limit: 5,
          time_range: "short_term",
        },
        userId: userId,
      });

      let topTracks: TrackData[] = [];
      for (const item of res.items) {
        topTracks.push({
          uri: item.uri,
          name: item.name,
          artist: item.artists[0].name,
          album: item.album?.name,
          albumCoverUrl: item.album?.images?.[0]?.url,
        } as TrackData);
      }

      return { topTracks: topTracks };
    } catch (e: any) {
      throw new HttpsError(
        "internal",
        `Failed to get top tracks: ${e.message}`
      );
    }
  }
);
