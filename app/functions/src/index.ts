import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// IMPORTANT: the following must be run before importing other firebase function files
// ----
admin.initializeApp();
// import { spotifyClientSecretVar } from "./config";
// setGlobalOptions({ region: "europe-west1", secrets: [spotifyClientSecretVar] });
import "./config";
setGlobalOptions({ region: "europe-west1" });
// ----

// DEBUG:
// it is possible to deploy a function directly from index.ts as below,
// but for some reason all the other exports fail from the other files...
// might just stick to hosting the functions using the Firebase emulator
// import { onCall } from "firebase-functions/v2/https";
// export const ultraMinimalTest = onCall((request) => {
//   console.log("Ultra minimal test function was called!");
//   return {
//     success: true,
//     message: "Container started with ultra minimal setup!",
//   };
// });

import * as spotify from "./spotify";
import * as stats from "./stats";
import * as queue from "./queue";

export const exchangeSpotifyCode = spotify.exchangeSpotifyCode;

export const getTopTracks = stats.getTopTracks;

export const getActiveSpotifyDevices = queue.getActiveSpotifyDevices;
export const setSpotifyDevice = queue.setSpotifyDevice;
export const getSpotifyPlaybackState = queue.getSpotifyPlaybackState;
export const createSession = queue.createSession;
export const joinSession = queue.joinSession;
export const searchSpotifyTracks = queue.searchSpotifyTracks;
export const addTrackToQueue = queue.addTrackToQueue;
export const voteForTrack = queue.voteForTrack;
export const playNextTrack = queue.playNextTrack;
