import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// IMPORTANT: the following must be run before importing other firebase function files
// ----
admin.initializeApp();
// import "./config";
setGlobalOptions({ region: "europe-west1" });
// ----

import * as spotify from "./spotify";
import * as stats from "./stats";
import * as queue from "./queue";
import * as quiz from "./quiz";

export const exchangeSpotifyCode = spotify.exchangeSpotifyCode;

export const getTopTracks = stats.getTopTracks;
export const getTopArtists = stats.getTopArtists;

export const getActiveSpotifyDevices = queue.getActiveSpotifyDevices;
export const setSpotifyDevice = queue.setSpotifyDevice;
export const getSpotifyPlaybackState = queue.getSpotifyPlaybackState;
export const createSession = queue.createSession;
export const joinSession = queue.joinSession;
export const searchSpotifyTracks = queue.searchSpotifyTracks;
export const addTrackToQueue = queue.addTrackToQueue;
export const voteForTrack = queue.voteForTrack;
export const playNextTrack = queue.playNextTrack;

export const createQuiz = quiz.createQuiz;
export const joinQuiz = quiz.joinQuiz;
export const startQuiz = quiz.startQuiz;
export const endQuiz = quiz.endQuiz;
export const getQuizState = quiz.getQuizState;
export const setParticipantIsrc = quiz.setParticipantIsrc;
export const storeQuizQuestions = quiz.storeQuizQuestions;
export const setGeneratingQuestionsStatus = quiz.setGeneratingQuestionsStatus;
export const submitQuizAnswer = quiz.submitQuizAnswer;
export const advanceQuizQuestion = quiz.advanceQuizQuestion;
