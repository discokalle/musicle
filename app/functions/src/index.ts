import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

import { spotifyClientSecretVar } from "./config";

import * as spotify from "./spotify";
import * as queue from "./queue";

admin.initializeApp();

setGlobalOptions({ region: "europe-west1", secrets: [spotifyClientSecretVar] });

export const callSpotifyApi = spotify.callSpotifyApi;
export const exchangeSpotifyCode = spotify.exchangeSpotifyCode;

export const createSession = queue.createSession;
export const joinSession = queue.joinSession;
export const searchSpotifyTracks = queue.searchSpotifyTracks;
