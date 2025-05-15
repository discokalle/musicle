import { useLocation, Outlet, Link } from "react-router";

function QuizLayout() {
  const location = useLocation();
  const atRoot = location.pathname === "/quiz";

  const navCSS =
    "absolute flex flex-col items-center left-1/8 top-1/8 transform -translate-x-1/8 -translate-y-1/8";

  return (
    <>
      <div className={navCSS}>
        {atRoot ? (
          <div className="flex gap-8 panel-card">
            <Link to="/quiz/single" className="link-highlight text-lg">
              Single
            </Link>
            <Link to="/quiz/multi" className="link-highlight text-lg">
              Multi
            </Link>
          </div>
        ) : (
          <div className="panel-card">
            <Link to="/quiz" className="link-highlight text-lg">
              ← Back
            </Link>
          </div>
        )}
      </div>

      <Outlet />
    </>
  );
}

export default QuizLayout;
