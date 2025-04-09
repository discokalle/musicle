import { BrowserRouter as Router, Routes, Route } from "react-router";

// assets
import Logo from "./assets/superman_logo.png";

// components
import NavBar from "./components/NavBar";

// pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Learn from "./pages/Learn";

function App() {
  const backgroundCSS = "bg-teal-500 bg-center absolute w-full h-full";

  const navColNames: string[] = ["Home", "Learn", "Profile"];
  return (
    <Router>
      <div className={backgroundCSS}>
        <div className="flex items-center justify-between px-8 py-4">
          <img src={Logo} alt="Logo" className="w-10 h-10" />
          <NavBar colNames={navColNames}></NavBar>
        </div>
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
