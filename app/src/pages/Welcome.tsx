import Button from "../components/Button";

import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { auth } from "../firebase";
import { centerContainerCSS, subtitleCSS, titleCSS } from "../styles";

function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // prevent logged-in user from navigating to welcome page
  useEffect(() => {
    setIsLoading(true);
    if (auth?.currentUser) {
      navigate("/home");
    }
    setIsLoading(false);
  }, [auth]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        WELCOME TO <span className="italic text-accent font-bold">MUSICLE</span>
      </h1>
      <p className={subtitleCSS}>
        The social music app that makes any get-together better!
      </p>
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
