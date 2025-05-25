import { useNavigate } from "react-router";
import { useState } from "react";
import { AuthErrorCodes, signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, set } from "firebase/database";

import { auth, db } from "../firebase";

import Button from "../components/Button";
import LoadingAnimation from "../components/LoadingAnimation";

import { centerContainerCSS, titleCSS } from "../styles";
import clsx from "clsx";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // note: either username or email
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      let emailAddr = email;
      try {
        const snapshot = await get(ref(db, `usernames/${email}`));
        if (snapshot.exists()) {
          // if username was entered, retrieve corresponding email address
          const userId = snapshot.val();
          const userSnapshot = await get(ref(db, `users/${userId}`));
          emailAddr = userSnapshot.val().email;
        }
      } catch (e: any) {
        alert(`Could not find user ${email}`);
        setIsLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, emailAddr, password);
      await set(ref(db, `users/${auth.currentUser?.uid}/isOnline`), true);
      setIsLoading(false);
      navigate("/home");
    } catch (e: any) {
      if (e.code == AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        alert("Invalid login credentials. Please try again.");
      } else {
        alert(`Error: ${e.message}`);
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  if (isLoading) {
    return <LoadingAnimation></LoadingAnimation>;
  }

  const inputCSS =
    "text-neutral w-[90%] mx-auto p-2 border border-gray-300 rounded-md\
     focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className={clsx(centerContainerCSS, "!gap-10")}>
      <h1 className={titleCSS}>Login To Your Account</h1>
      <div className="flex flex-col gap-5 text-xl w-full">
        <input
          type="text"
          placeholder="Username or Email"
          className={inputCSS}
          value={email}
          onChange={(text) => setEmail(text.target.value)}
          onKeyDown={handleKeyDown}
        ></input>
        <input
          type="password"
          placeholder="Password"
          className={inputCSS}
          value={password}
          onChange={(text) => setPassword(text.target.value)}
          onKeyDown={handleKeyDown}
        ></input>
      </div>
      <Button size="large" onClick={handleLogin}>
        Login
      </Button>
    </div>
  );
}

export default Login;
