import { useNavigate } from "react-router";
import { useState } from "react";
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

import { auth, db } from "../firebase";

import Button from "../components/Button";

function SignUp() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      if (username.length > 12) {
        throw new Error("Username can at most be 12 characters long.");
      }

      const snapshot = await get(ref(db, `usernames/${username}`));
      if (snapshot.exists()) {
        alert("Username is already taken. Please try again.");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userId = userCred.user.uid;
      await set(ref(db, `usernames/${username}`), userId);
      await set(ref(db, `users/${userId}`), {
        email,
        username,
        isOnline: true,
      });
      await updateProfile(userCred.user, { displayName: username });

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

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSignUp();
    }
  };

  const centerContainerCSS =
    "absolute flex flex-col gap-10 items-center left-1/2 top-[30%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  const inputCSS =
    "text-neutral w-[90%] mx-auto p-2 border border-gray-300 rounded-md\
     focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Create Your Account</h1>
      <div className="flex flex-col gap-5 text-xl w-full">
        <input
          type="text"
          placeholder="Username"
          className={inputCSS}
          onChange={(text) => setUsername(text.target.value)}
          onKeyDown={handleKeyDown}
        ></input>
        <input
          type="email"
          placeholder="Email"
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
      <Button size="large" onClick={handleSignUp}>
        Sign Up
      </Button>
    </div>
  );
}

export default SignUp;
