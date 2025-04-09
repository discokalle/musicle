import { Link, useLocation } from "react-router";

function getPageLink(colName: string): string {
  colName = colName.toLowerCase().replace(" ", "-");
  return `/${colName !== "home" ? colName : ""}`;
}

interface Props {
  colNames: string[];
}

// ``-string are used for template literals, enables embed. of vars. and exprs. in string
function NavBar({ colNames }: Props) {
  const location = useLocation();

  const navBarItemCSS: string =
    "text-neutral text-lg transition duration-250 hover:underline hover:text-accent";

  return (
    <>
      <div className="flex gap-12">
        {colNames.map((colName) => {
          const link: string = getPageLink(colName);
          const isActive: boolean = location.pathname === link;
          return (
            <Link
              key={colName}
              to={link}
              className={`${navBarItemCSS} ${
                isActive ? "underline font-bold" : ""
              }`}
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
