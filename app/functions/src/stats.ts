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
  async (req: CallableRequest<{ userId: string; timeRange: string }>) => {
    const { userId, timeRange } = req.data;

    if (!userId || typeof userId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid or missing userId.");
    }
    if (!timeRange || typeof timeRange !== "string") {
      throw new HttpsError("invalid-argument", "Invalid or missing timeRange.");
    }

    /**
     * time_range:
     * Over what time frame the affinities are computed.
     * Valid values:
     * long_term (calculated from ~1 year of data and
     * including all new data as it becomes available),
     * medium_term (approximately last 6 months),
     * short_term (approximately last 4 weeks).
     * Default: medium_term
     */

    try {
      const res = await callSpotifyApi({
        endpoint: "/v1/me/top/tracks",
        method: "GET",
        queryParams: {
          limit: 20,
          time_range: timeRange,
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
