import { SongInfo } from "./song-info";
import { Question } from "./components/QuizCard";

export function generateQuestions(song: SongInfo): Question[] {
  const questions: Question[] = [];

  if (song.title && song.artist) {
    questions.push({
      question: `Which of these is the title of a song by ${song.artist}?`,
      options: [song.title, "Epic song yo.", "Song Name 123", "mySong"].sort(
        () => Math.random() - 0.5 //Randomize order
      ),
      answer: song.title,
    });
  }

  if (song.artist && song.title) {
    questions.push({
      question: `What artist released '${song.title}'?`,
      options: [
        song.artist,
        "Totally Real Band",
        "Quiz Bois",
        "Trasan och Banarne",
      ].sort(() => Math.random() - 0.5),
      answer: song.artist,
    });
  }

  if (song.releaseDate) {
    questions.push({
      question: `When was '${song.title}' by ${song.artist} released?`,
      options: [
        song.releaseDate,
        "2026-01-01",
        "1234-05-06",
        "1800-12-12",
      ].sort(() => Math.random() - 0.5),
      answer: song.releaseDate,
    });
  }

  if (song.artistBeginArea) {
    questions.push({
      question: `Where is ${song.artist} from?`,
      options: [
        song.artistBeginArea,
        "The Vatican",
        "The Moon",
        "The Eslöv",
      ].sort(() => Math.random() - 0.5),
      answer: song.artistBeginArea,
    });
  }

  if (song.artistBeginYear) {
    questions.push({
      question: `When was ${song.artist} born/formed?`,
      options: [song.artistBeginYear, "1500", "1800", "3000"].sort(
        () => Math.random() - 0.5
      ),
      answer: song.artistBeginYear,
    });
  }

  if (song.artistActiveArea) {
    questions.push({
      question: `Where is/was ${song.artist} active?`,
      options: [
        song.artistActiveArea,
        "Kalmar Union",
        "Roman Empire",
        "Wakanda",
      ].sort(() => Math.random() - 0.5),
      answer: song.artistActiveArea,
    });
  }

  return questions;
}
