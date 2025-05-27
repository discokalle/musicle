import SearchBarDb from "./SearchBarDb";

import { clsx } from "clsx";
import { Link, useLocation, useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { ref, set } from "firebase/database";

import { auth, db } from "../firebase";

import { linkHighlightCSS } from "../styles";

type Props = {
  logo: string;
  cols: [string, string][];
  isLoggedIn: boolean;
};

function NavBar({ logo, cols, isLoggedIn }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const userId = auth.currentUser?.uid;
      await signOut(auth);
      await set(ref(db, `users/${userId}/isOnline`), null);
    } catch (e: any) {
      // console.log("Signout failed.");
    }
  };

  const searchBarMatchLogic = (matchQuery: string) => {
    navigate(`/profile/${matchQuery}`);
  };

  const containerCSS =
    "fixed top-0 h-[8%] z-50 w-full flex items-center justify-between px-8 py-2 bg-secondary";

  return (
    <div className={containerCSS}>
      <Link
        to={auth.currentUser ? "/home" : "/"}
        className="relative inline-block h-[75%]"
      >
        <img src={logo} alt="Logo" className="w-full h-full" />
      </Link>
      {isLoggedIn && (
        <SearchBarDb
          dbCollectionName="usernames"
          matchLogic={searchBarMatchLogic}
          inputPlaceholderText="Search for a user..."
        ></SearchBarDb>
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
              className={clsx(
                linkHighlightCSS,
                `text-lg ${
                  location.pathname === colLink ? "underline font-bold" : ""
                }`
              )}
              onClick={colLink === "/" ? handleSignOut : undefined}
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
