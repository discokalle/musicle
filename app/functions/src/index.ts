import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// important that this is called before the other function file imports!
admin.initializeApp();
import { spotifyClientSecretVar } from "./config";
setGlobalOptions({ region: "europe-west1", secrets: [spotifyClientSecretVar] });

import * as spotify from "./spotify";
import * as queue from "./queue";

export const callSpotifyApi = spotify.callSpotifyApi;
export const exchangeSpotifyCode = spotify.exchangeSpotifyCode;

export const createSession = queue.createSession;
export const joinSession = queue.joinSession;
export const searchSpotifyTracks = queue.searchSpotifyTracks;
export const addTrackToQueue = queue.addTrackToQueue;
export const voteForTrack = queue.voteForTrack;
