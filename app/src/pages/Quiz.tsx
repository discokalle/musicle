import { useEffect, useState } from "react";
import { getInfoByISRC } from "../song-info";
import QuizCard, { Question } from "../components/QuizCard";
import { generateQuestions } from "../question-generator";

//ISRC codes seem to be universal across services for recordings.
const ISRCs = [
  "GBN9Y1100088",
  "USSM17700373",
  "SEPQA2500011",
  "GBAYE0601696",
  "USUG11500737",
];

function randomPick(array: Question[], count: number): Question[] {
  return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}
function shuffle(array: Question[]): Question[] {
  return [...array].sort(() => 0.5 - Math.random());
}

function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      const finalQuestions: Question[] = [];

      for (const isrc of ISRCs) {
        const song = await getInfoByISRC(isrc);
        if (song) {
          const generated = generateQuestions(song);
          const selected = randomPick(generated, 2);
          finalQuestions.push(...selected);
        }
      }
      setQuestions(shuffle(finalQuestions));
      setLoading(false);
    }

    loadQuestions();
  }, []);

  const centerContainerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  return (
    <div className={centerContainerCSS}>
      {loading ? (
        <p className="text-neutral">Loading...</p>
      ) : (
        <QuizCard questions={questions} />
      )}
    </div>
  );
}

export default Quiz;
