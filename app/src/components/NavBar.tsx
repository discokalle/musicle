import SearchBar from "../components/SearchBar";

import { Link, useLocation } from "react-router";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";

type Props = {
  logo: string;
  cols: [string, string][];
  isLoggedIn: boolean;
};

function NavBar({ logo, cols, isLoggedIn }: Props) {
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

  return (
    <div className={containerCSS}>
      <img src={logo} alt="Logo" className="relative h-[75%]" />
      {isLoggedIn && (
        <SearchBar
          dbCollectionName="usernames"
          inputPlaceholderText="Search for a user..."
        ></SearchBar>
      )}
      <div className="flex gap-12">
        {cols.map(([colName, colLink]) => {
          if (
            (isLoggedIn && (colLink === "login" || colLink === "sign-up")) ||
            (!isLoggedIn && !(colLink === "login" || colLink === "sign-up"))
          ) {
            return null;
          }
          return (
            <Link
              key={colName}
              to={
                colLink !== "profile"
                  ? colLink
                  : colLink + "/" + auth.currentUser?.displayName ||
                    "unknown-user"
              }
              className={`link-highlight text-lg ${
                location.pathname === colLink ? "underline font-bold" : ""
              }`}
              onClick={colLink === "sign-out" ? handleSignOut : undefined}
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
