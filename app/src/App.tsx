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

      <div className="fixed top-0 z-50 w-full flex items-center justify-between px-8 py-4 bg-secondary">
        <img src={supermanLogo} alt="Logo" className="w-10 h-10" />
        <NavBar
          colNames={navColNames}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        ></NavBar>
      </div>

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route
          path="/sign-up"
          element={<SignUp setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/home" element={<Home />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/learn" element={<Learn />} />
      </Routes>
    </Router>
  );
}

export default App;
