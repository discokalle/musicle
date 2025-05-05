import { SongInfo } from "./song-info";
import { Question } from "./components/QuizCard";

export function generateQuestions(song: SongInfo): Question[] {
  const questions: Question[] = [];

  if (song.title && song.artist) {
    questions.push({
      question: `Which of these is the title of a song by ${song.artist}?`,
      options: [song.title, "Song2", "Song3", "Song4"].sort(
        () => Math.random() - 0.5 //Randomize order
      ),
      answer: song.title,
    });
  }

  if (song.artist && song.title) {
    questions.push({
      question: `What artist released '${song.title}'?`,
      options: [song.artist, "Artist2", "Artist3", "Artist4"].sort(
        () => Math.random() - 0.5
      ),
      answer: song.artist,
    });
  }

  if (song.releaseDate) {
    questions.push({
      question: `When was '${song.title}' by ${song.artist} released?`,
      options: [song.releaseDate, "1", "2", "3"].sort(
        () => Math.random() - 0.5
      ),
      answer: song.releaseDate,
    });
  }

  if (song.artistBeginArea) {
    questions.push({
      question: `Where is ${song.artist} from?`,
      options: [song.artistBeginArea, "Place1", "Place2", "Place3"].sort(
        () => Math.random() - 0.5
      ),
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
        "Burkina Faso",
        "The Moon",
        "Eslöv",
      ].sort(() => Math.random() - 0.5),
      answer: song.artistActiveArea,
    });
  }

  return questions;
}
