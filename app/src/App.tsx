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
import Profile from "./pages/Profile";
import Learn from "./pages/Learn";
import SpotifyCallback from "./pages/SpotifyCallback";

function App() {
  const backgroundCSS = "bg-primary bg-center absolute w-full h-full";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navColNames = [
    "Sign Up",
    "Login",
    "Home",
    "Learn",
    "Profile",
    "Sign Out",
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
        colNames={navColNames}
        isLoggedIn={isLoggedIn}
      ></NavBar>

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
