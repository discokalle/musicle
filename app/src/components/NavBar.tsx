import { Link, useLocation } from "react-router";

function getPageLink(colName: string): string {
  if (colName == "Sign Out") return "";
  return colName.toLowerCase().replace(" ", "-");
}

interface Props {
  colNames: string[];
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

// ``-string are used for template literals, enables embed. of vars. and exprs. in string
function NavBar({ colNames, isLoggedIn, setIsLoggedIn }: Props) {
  // console.log("isLoggedIn:", isLoggedIn);
  const location = useLocation();

  const navBarItemCSS =
    "text-neutral text-lg transition duration-250 hover:underline hover:text-accent";

  return (
    <>
      <div className="flex gap-12">
        {colNames.map((colName) => {
          const link = getPageLink(colName);
          if (
            (isLoggedIn && (link === "login" || link === "sign-up")) ||
            (!isLoggedIn && link !== "login" && link !== "sign-up")
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
