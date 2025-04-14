import { Link, useLocation } from "react-router";

import { auth } from "../firebase";

function getPageLink(colName: string): string {
  if (colName === "Sign Out") return "/";
  if (colName === "Profile") {
    return "/profile/" + (auth.currentUser?.displayName || "unknown-user");
  }
  return colName.toLowerCase().replace(" ", "-");
}

interface Props {
  colNames: string[];
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

function NavBar({ colNames, isLoggedIn, setIsLoggedIn }: Props) {
  const location = useLocation();

  const navBarItemCSS =
    "text-neutral text-lg transition duration-250 hover:underline hover:text-accent";

  return (
    <>
      <div className="flex gap-12">
        {colNames.map((colName) => {
          const link = getPageLink(colName);
          if (
            (isLoggedIn && (colName === "Login" || colName === "Sign Up")) ||
            (!isLoggedIn && colName === "Login") ||
            colName === "Sign Up"
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
              onClick={() => {
                if (colName === "Sign Out") {
                  setIsLoggedIn(false);
                }
              }}
            >
              {colName}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default NavBar;
