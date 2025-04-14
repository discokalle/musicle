import { useNavigate } from "react-router";
import { useState } from "react";
import { AuthErrorCodes, createUserWithEmailAndPassword } from "firebase/auth";

import { auth } from "../firebase";

import Button from "../components/Button";

interface Props {
  setIsLoggedIn: (value: boolean) => void;
}

function SignUp({ setIsLoggedIn }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsLoggedIn(true);
      navigate("/home");
    } catch (e: any) {
      if (e.code == AuthErrorCodes.INVALID_EMAIL) {
        alert("Invalid email format. Please try agian.");
      } else if (e.code == AuthErrorCodes.WEAK_PASSWORD) {
        alert("Password has to be at least 6 characters. Please try again.");
      } else {
        alert(`Error: ${e.message}`);
      }
    }
  };

  const centerContainerCSS =
    "absolute flex flex-col gap-10 items-center left-1/2 top-[30%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  const inputCSS =
    "text-neutral w-[90%] mx-auto p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Create Your Account</h1>
      <div className="flex flex-col gap-5 text-xl w-full">
        {/* <input type="text" placeholder="Username" className={inputCSS}></input> */}
        <input
          type="email"
          placeholder="Email"
          className={inputCSS}
          value={email}
          onChange={(text) => setEmail(text.target.value)}
        ></input>
        <input
          type="password"
          placeholder="Password"
          className={inputCSS}
          value={password}
          onChange={(text) => setPassword(text.target.value)}
        ></input>
      </div>
      <Button size="large" onClick={handleSignUp}>
        Sign Up
      </Button>
    </div>
  );
}

export default SignUp;
