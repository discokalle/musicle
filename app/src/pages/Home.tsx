import Button from "../components/Button";

import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";

function Home() {
  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is <span className="italic text-accent font-bold">MUSICLE</span>
      </h1>
      <p className={subtitleCSS}>
        Listen to music in a fair voting-based queue, or play a music quiz that
        considers the music taste of all your friends!
      </p>

      <div className="flex gap-10">
        <Button size="large">Queue</Button>
        <Button size="large">Quiz</Button>
      </div>
    </div>
  );
}

export default Home;
