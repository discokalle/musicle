import { Link } from "react-router";
import Button from "../components/Button";

function Welcome() {
  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[40%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        WELCOME TO{" "}
        <span className="italic text-accent font-bold">MUSICLE!</span>
      </h1>
      <div className="flex gap-10">
        <Link to="/sign-up">
          <Button size="large">Sign Up</Button>
        </Link>
        <Link to="/login">
          <Button size="large">Login</Button>
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
