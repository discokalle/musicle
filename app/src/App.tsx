import { BrowserRouter as Router, Routes, Route } from "react-router";

// assets
import supermanLogo from "./assets/superman_logo.png";

// components
import NavBar from "./components/NavBar";

// pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Learn from "./pages/Learn";

function App() {
  const backgroundCSS: string = "bg-primary bg-center absolute w-full h-full";

  const navColNames: string[] = ["Home", "Learn", "Profile"];

  return (
    <Router>
      <div className={backgroundCSS}></div>

      <div className="fixed top-0 z-50 w-full flex items-center justify-between px-8 py-4 bg-secondary">
        <img src={supermanLogo} alt="Logo" className="w-10 h-10" />
        <NavBar colNames={navColNames}></NavBar>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/learn" element={<Learn />} />
      </Routes>
    </Router>
  );
}

export default App;
