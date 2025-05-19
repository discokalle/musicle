import { defineSecret, defineString } from "firebase-functions/params";

export const spotifyClientIdVar = defineString("SPOTIFY_CLIENT_ID");
export const spotifyRedirectUriVar = defineString("SPOTIFY_REDIRECT_URI");

// secret is stored in the Google Cloud Secret Manager
export const spotifyClientSecretVar = defineSecret("SPOTIFY_CLIENT_SECRET");
