import { Link } from "react-router";

interface Props {
  colNames: string[];
}

function getPageLink(colName: string): string {
  colName = colName.toLowerCase().replace(" ", "-");
  return `/${colName !== "home" ? colName : ""}`;
}

// ``-string are used for template literals, enables embed. of vars. and exprs. in string
function NavBar({ colNames }: Props) {
  const navBarItemCSS: string =
    "text-white text-lg transition duration-500 hover:underline hover:text-black";
  return (
    <>
      <div className="flex gap-12">
        {colNames.map((colName) => (
          <div className={navBarItemCSS} key={colName}>
            <Link to={getPageLink(colName)} className="text-white">
              {colName}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

export default NavBar;
