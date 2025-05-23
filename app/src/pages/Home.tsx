import { Link } from "react-router";
import Button from "../components/Button";

import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";

function Home() {
  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is <span className="italic text-accent font-bold">MUSICLE</span>
      </h1>
      <p className={subtitleCSS}>
        Grab some friends and host a live queue or play a music quiz!
      </p>

      <div className="flex gap-10">
        <Link to="/queue">
          <Button size="large">Queue</Button>
        </Link>
        <Link to="/quiz">
          <Button size="large">Quiz</Button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
