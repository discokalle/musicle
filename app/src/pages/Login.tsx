import { useNavigate } from "react-router";
import Button from "../components/Button";

interface Props {
  setIsLoggedIn: (value: boolean) => void;
}

function Login({ setIsLoggedIn }: Props) {
  const navigate = useNavigate();

  const handleSignUp = () => {
    setIsLoggedIn(true);
    navigate("/home");
  };

  const centerContainerCSS =
    "absolute flex flex-col gap-10 items-center left-1/2 top-[30%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  const inputCSS =
    "text-neutral w-[90%] mx-auto p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Login To Your Account</h1>
      <div className="flex flex-col gap-5 text-xl w-full">
        <input type="text" placeholder="Username" className={inputCSS}></input>
        <input
          type="password"
          placeholder="Password"
          className={inputCSS}
        ></input>
      </div>
      <Button size="large" onClick={handleSignUp}>
        Login
      </Button>
    </div>
  );
}

export default Login;
