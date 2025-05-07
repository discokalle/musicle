import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// IMPORTANT: the following must be run before importing other firebase function files
// ----
admin.initializeApp();
import { spotifyClientSecretVar } from "./config";
setGlobalOptions({ region: "europe-west1", secrets: [spotifyClientSecretVar] });
// ----

import * as spotify from "./spotify";
import * as queue from "./queue";

export const callSpotifyApi = spotify.callSpotifyApi;
export const exchangeSpotifyCode = spotify.exchangeSpotifyCode;

export const createSession = queue.createSession;
export const joinSession = queue.joinSession;
export const searchSpotifyTracks = queue.searchSpotifyTracks;
export const addTrackToQueue = queue.addTrackToQueue;
export const voteForTrack = queue.voteForTrack;
