import { useNavigate } from "react-router";
import { useState } from "react";
import { ref, get } from "firebase/database";

import { db } from "../firebase";

function SearchBar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const CSS =
    "w-100 bg-primary text-neutral rounded-4xl shadow-md/25 p-4 hover:text-accent transition duration-250";

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      try {
        const snapshot = await get(ref(db, `usernames/${username}`));
        if (snapshot.exists()) {
          navigate(`/profile/${username}`);
        } else {
          throw new Error("Invalid user.");
        }
      } catch (e: any) {
        alert(`The user ${username} does not exist. Please try again.`);
      }
    }
  };

  return (
    <input
      type="text"
      placeholder="Search for a user..."
      className={CSS}
      onChange={(text) => {
        setUsername(text.target.value);
      }}
      onKeyDown={handleKeyDown}
    ></input>
  );
}

export default SearchBar;
