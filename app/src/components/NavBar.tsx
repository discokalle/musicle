import SearchBar from "../components/SearchBar";

import { Link, useLocation } from "react-router";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";

function getPageLink(colName: string): string {
  if (colName === "Sign Out") return "/";
  if (colName === "Profile") {
    return "/profile/" + (auth.currentUser?.displayName || "unknown-user");
  }
  return colName.toLowerCase().replace(" ", "-");
}

type Props = {
  logo: string;
  colNames: string[];
  isLoggedIn: boolean;
};

function NavBar({ logo, colNames, isLoggedIn }: Props) {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.log("Signout failed.");
    }
  };

  const containerCSS =
    "fixed top-0 h-[8%] z-50 w-full flex items-center justify-between px-8 py-2 bg-secondary";

  const navBarItemCSS =
    "text-neutral text-lg transition duration-250 hover:underline hover:text-accent";

  return (
    <div className={containerCSS}>
      <img src={logo} alt="Logo" className="relative h-[80%]" />
      {isLoggedIn && (
        <SearchBar
          dbCollectionName="usernames"
          inputPlaceholderText="Search for a user..."
        ></SearchBar>
      )}
      <div className="flex gap-12">
        {colNames.map((colName) => {
          const link = getPageLink(colName);
          if (
            (isLoggedIn && (colName === "Login" || colName === "Sign Up")) ||
            (!isLoggedIn && !(colName === "Login" || colName === "Sign Up"))
          ) {
            return null;
          }
          const isActive = location.pathname === link;
          return (
            <Link
              key={colName}
              to={link}
              className={`${navBarItemCSS} ${
                isActive ? "underline font-bold" : ""
              }`}
              onClick={colName === "Sign Out" ? handleSignOut : undefined}
            >
              {colName}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default NavBar;
