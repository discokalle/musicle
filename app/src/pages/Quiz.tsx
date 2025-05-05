import { useEffect, useState } from "react";
import { getInfoByISRC, SongInfo } from "../song-info";
import QuizCard, { Question } from "../components/QuizCard";
import { generateQuestions } from "../question-generator";

function Quiz() {
  const [song, setSong] = useState<SongInfo | null>(null);

  useEffect(() => {
    getInfoByISRC("SEPQA2500011").then(setSong); //ISRC is probably universal across services? Many apis / services seem to have this code for songs.
  }, []);

  const centerContainerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  const titleCSS =
    "text-3xl text-white text-center transition-transform duration-200 ease-in-out hover:scale-110";

  const questions: Question[] = song ? generateQuestions(song) : [];

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Song Info Quiz</h1>
      {song ? (
        <>
          <p className="text-neutral">Title: {song.title}</p>
          <p className="text-neutral">Artist: {song.artist}</p>
          <p className="text-neutral">First Release Date: {song.releaseDate}</p>
          <p className="text-neutral">
            Formed/born in: {song.artistBeginArea}, {song.artistBeginYear}
          </p>
          <p className="text-neutral"> Active in: {song.artistActiveArea} </p>
        </>
      ) : (
        <p className="text-neutral">Loading...</p>
      )}
      <QuizCard questions={questions} />
    </div>
  );
}

export default Quiz;
