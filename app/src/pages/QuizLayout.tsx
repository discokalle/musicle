import { Link } from "react-router";

import Button from "../components/Button";

import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";

function QuizLayout() {
  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is{" "}
        <span className="italic text-accent font-bold">THE MUSIC QUIZ</span>
      </h1>
      <p className={subtitleCSS}>
        Gather your friends and generate a quiz that is a mix of everyone's
        unique music taste!
      </p>
      <div className="flex gap-10">
        <Link to="single">
          <Button size="large">Single</Button>
        </Link>
        <Link to="multi">
          <Button size="large">Multiplayer</Button>
        </Link>
      </div>
    </div>
  );
}

export default QuizLayout;
