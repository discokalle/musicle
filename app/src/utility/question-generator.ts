import { Question, SongInfo } from "../types";

function falseOptions(list: string[], correctAnswer: string): string[] {
  const result: string[] = [];
  const used = new Set<number>();

  while (result.length < 3 && used.size < list.length) {
    const i = Math.floor(Math.random() * list.length); //random index
    const option = list[i];

    //skip if used or correct option
    if (!used.has(i) && option.toLowerCase() !== correctAnswer.toLowerCase()) {
      used.add(i); //mark used
      result.push(option);
    }
  }

  return result; // return 3 false options
}

function falseYears(correctYearStr: string): string[] {
  //Picks 3 years; offset by 1-5 years.
  const correctYear = parseInt(correctYearStr);
  const fakeYears: string[] = [];
  while (fakeYears.length < 3) {
    const offset = Math.floor(Math.random() * 5) + 1; //random 0 to 0.49999; floor + 1 = 1 to 5
    const year = correctYear + (Math.random() < 0.5 ? -offset : offset); //50/50 if +or-
    if (
      year !== correctYear &&
      year < 2026 &&
      !fakeYears.includes(year.toString())
    ) {
      fakeYears.push(year.toString());
    }
  }
  return fakeYears;
}

export function generateQuestions(song: SongInfo): Question[] {
  const questions: Question[] = [];

  /* if (song.title && song.artist) {
    questions.push({
      question: `Which of these is the title of a song by ${song.artist}?`,
      options: [song.title, "Epic song yo.", "Song Name 123", "mySong"].sort(
        () => Math.random() - 0.5 //Randomize order
      ),
      answer: song.title,
    });
  } */

  if (song.artist && song.title) {
    questions.push({
      question: `What artist released '${song.title}'?`,
      options: [song.artist, ...falseOptions(artists, song.artist)].sort(
        () => Math.random() - 0.5
      ),
      answer: song.artist,
    });
  }

  if (song.releaseDate) {
    //Date format is inconsistent in MB, but Year is always included and first.
    const releaseYear = song.releaseDate.split("-")[0];
    questions.push({
      question: `When was '${song.title}' by ${song.artist} released?`,
      options: [releaseYear, ...falseYears(releaseYear)].sort(
        () => Math.random() - 0.5
      ),
      answer: releaseYear,
    });
  }

  if (song.artistBeginArea) {
    questions.push({
      question: `Where is ${song.artist} from?`,
      options: [
        song.artistBeginArea,
        ...falseOptions(cities, song.artistBeginArea),
      ].sort(() => Math.random() - 0.5),
      answer: song.artistBeginArea,
    });
  }

  if (song.artistBeginYear) {
    //Date format is inconsistent in MB, but Year is always included and first.
    const artistYear = song.artistBeginYear.split("-")[0];
    questions.push({
      question: `When was ${song.artist} born/formed?`,
      options: [artistYear, ...falseYears(artistYear)].sort(
        () => Math.random() - 0.5
      ),
      answer: artistYear,
    });
  }

  /*   if (song.artistActiveArea) { 
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
  } */

  return questions;
}
const cities = [
  //Many American and British cities + some capitals and large cities.
  //Excluded New York City, because smaller areas in that city are often used instead for some reason.
  "Los Angeles",
  "Seattle",
  "Chicago",
  "Atlanta",
  "San Francisco",
  "Miami",
  "Houston",
  "London",
  "Manchester",
  "Liverpool",
  "Birmingham",
  "Glasgow",
  "Bristol",
  "Cardiff",
  "Dublin",
  "Sydney",
  "Melbourne",
  "Toronto",
  "Montreal",
  "Ottawa",
  "Vancouver",
  "Tokyo",
  "Seoul",
  "Hong Kong",
  "Beijing",
  "Paris",
  "Berlin",
  "Hamburg",
  "Stockholm",
  "Madrid",
  "Barcelona",
  "Rome",
  "Oslo",
  "Copenhagen",
  "Helsinki",
  "Amsterdam",
];

const artists = [
  //Some of the most streamed artists
  "The Weeknd",
  "Drake",
  "Ariana Grande",
  "Eminem",
  "Post Malone",
  "Billie Eilish",
  "BTS",
  "Rihanna",
  "Coldplay",
  "Imagine Dragons",
  "Bruno Mars",
  "Maroon 5",
  "Juice WRLD",
  "XXXTENTACION",
  "Maroon 5",
  "Kendrick Lamar",
  "Travis Scott",
  "Future",
  "Lady Gaga",
  "Calvin Harris",
  "Khalid",
  "Sam Smith",
  "Queen",
  "Linkin Park",
  "Radiohead",
  "J. Cole",
  "Shakira",
  "Arctic Monkeys",
  "The Beatles",
  "Olivia Rodrigo",
  "21 Savage",
  "Twenty One Pilots",
  "OneRepublic",
  "Red Hot Chili Peppers",
  "Avicii",
  "Kygo",
  "Mac Miller",
  "Frank Ocean",
  "The Neighbourhood",
  "Elton John",
  "Sabrina Carpenter",
  "Lil Wayne",
  "Playboi Carti",
  "Lewis Capaldi",
  "The Kid LAROI",
  "50 Cent",
  "Fleetwood Mac",
  "ABBA",
  "Zara Larsson",
  "Tove Lo",
  "Swedish House Mafia",
  "Roxette",
  "Kent",
  "Ted Gärdestad",
  "Cornelis Vreeswijk",
];
