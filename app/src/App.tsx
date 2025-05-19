import { BrowserRouter as Router, Routes, Route } from "react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";

// assets
import supermanLogo from "./assets/superman-logo.png";

// components
import NavBar from "./components/NavBar";

// pages
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProfileLayout from "./pages/ProfileLayout";
import Profile from "./pages/Profile";
import Following from "./pages/Following";
import Followers from "./pages/Followers";
import SpotifyStats from "./pages/SpotifyStats";
import SpotifyCallback from "./pages/SpotifyCallback";
import Queue from "./pages/Queue";
import QueueSession from "./pages/QueueSession";
import QuizLayout from "./pages/QuizLayout";
import QuizSingle from "./pages/QuizSingle";
import QuizMulti from "./pages/QuizMulti";

function App() {
  const backgroundCSS = "bg-primary bg-center absolute w-full h-full";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navCols: [string, string][] = [
    ["Sign Up", "sign-up"],
    ["Login", "login"],
    ["Home", "home"],
    ["Quiz", "quiz"],
    ["Queue", "queue"],
    ["Profile", "profile"],
    ["Sign Out", "/"],
  ];

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(user ? true : false);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    // replace w/ proper loading animation later
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className={backgroundCSS}></div>
      <NavBar
        logo={supermanLogo}
        cols={navCols}
        isLoggedIn={isLoggedIn}
      ></NavBar>

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile/:username" element={<ProfileLayout />}>
          <Route path="overview" element={<Profile />} />
          <Route path="following" element={<Following />} />
          <Route path="followers" element={<Followers />} />
          <Route path="stats" element={<SpotifyStats />} />
        </Route>
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
        <Route path="/queue" element={<Queue />}></Route>
        <Route path="/queue/:sessionId" element={<QueueSession />}></Route>
        <Route path="/quiz" element={<QuizLayout />}>
          <Route path="single" element={<QuizSingle />} />
          <Route path="multi" element={<QuizMulti />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
