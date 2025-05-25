// functions
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

// Firebase variables
import { auth } from "./firebase";

// assets
import supermanLogo from "./assets/superman-logo.png";

// components
import NavBar from "./components/NavBar";
import LoadingAnimation from "./components/LoadingAnimation";

// pages
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";

import ProfileLayout from "./pages/ProfileLayout";
import Following from "./pages/Following";
import Followers from "./pages/Followers";

import SpotifyCallback from "./pages/SpotifyCallback";
import SpotifyStats from "./pages/SpotifyStats";

import Queue from "./pages/Queue";
import QueueSession from "./pages/QueueSession";
import QuizLayout from "./pages/QuizLayout";
import QuizSingle from "./pages/QuizSingle";
import QuizMulti from "./pages/QuizMulti";
import QuizSession from "./pages/QuizSession";

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
    return <LoadingAnimation></LoadingAnimation>;
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
          <Route index element={<Navigate to="spotify-stats" replace />} />
          <Route path="spotify-stats" element={<SpotifyStats />} />
          <Route path="following" element={<Following />} />
          <Route path="followers" element={<Followers />} />
        </Route>
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
        <Route path="/queue" element={<Queue />}></Route>
        <Route path="/queue/:sessionId" element={<QueueSession />}></Route>
        <Route path="/quiz" element={<QuizLayout />}>
          <Route path="single" element={<QuizSingle />} />
          <Route path="multi" element={<QuizMulti />} />
          <Route path="multi/:quizId" element={<QuizSession />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
