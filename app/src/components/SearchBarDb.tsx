import { useState, useEffect, useRef } from "react";
import {
  ref,
  get,
  query,
  orderByKey,
  startAt,
  endAt,
  limitToFirst,
} from "firebase/database";

import List from "./List";

import { db } from "../firebase";

type Props = {
  dbCollectionName: string;
  matchLogic: Function; // the logic to be used when we search for a query that matches the DB
  inputPlaceholderText: string;
  className?: string;
};

function SearchBarDb({
  dbCollectionName,
  matchLogic,
  inputPlaceholderText,
  className,
}: Props) {
  const [input, setInput] = useState("");
  const [recs, setRecs] = useState<string[]>([]); // recs = recommendations
  const [showRecs, setShowRecs] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (input.trim() === "") {
      setRecs([]);
      setShowRecs(false);
      return;
    }

    const fetchRecs = async (prefix: string) => {
      try {
        const searchQuery = query(
          ref(db, dbCollectionName),
          orderByKey(),
          startAt(prefix),
          endAt(prefix + "\uf8ff"),
          limitToFirst(5)
        );

        const snapshot = await get(searchQuery);
        if (snapshot.exists()) {
          const fetchedInputs = Object.keys(snapshot.val());
          setRecs(fetchedInputs);
          setShowRecs(true);
        } else {
          setRecs([]);
          setShowRecs(false);
        }
      } catch (e: any) {
        alert("Fetching error.");
        setRecs([]);
        setShowRecs(false);
      }
    };

    fetchRecs(input);
  }, [input]);

  const handleMatchAndCleanup = (matchQuery: string) => {
    setInput(matchQuery);
    setRecs([]);
    setShowRecs(false);
    matchLogic(matchQuery);
    setInput("");
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      try {
        const snapshot = await get(ref(db, `${dbCollectionName}/${input}`));
        if (snapshot.exists()) {
          handleMatchAndCleanup(input);
        } else {
          throw new Error("Invalid input.");
        }
      } catch (e: any) {
        alert(`The ${input} does not exist. Please try again.`);
      }
    }
  };

  const handleRecClick = (selectedInput: string) => {
    handleMatchAndCleanup(selectedInput);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setShowRecs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // cleanup
    };
  }, []);

  const containerCSS = `${className} relative w-100`;

  const inputCSS =
    "w-full bg-primary text-neutral rounded-4xl shadow-md/25\
    px-4 py-2 transition duration-250 focus:outline-none focus:ring-2 focus:ring-accent";

  const recsCSS = "absolute top-full w-full z-10 max-h-60 overflow-auto";

  const recItemCSS =
    "bg-secondary shadow-md/30 text-neutral m-1 px-4 py-2 hover:text-accent cursor-pointer";

  return (
    <div className={containerCSS} ref={searchBarRef}>
      <input
        type="text"
        placeholder={inputPlaceholderText}
        className={inputCSS}
        value={input}
        onChange={(text) => {
          setInput(text.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => input.trim() && recs.length > 0 && setShowRecs(true)}
      ></input>

      {showRecs && recs.length > 0 && (
        <List className={recsCSS}>
          {recs.map((rec) => (
            <li
              key={rec}
              onClick={() => handleRecClick(rec)}
              className={recItemCSS}
            >
              {rec}
            </li>
          ))}
        </List>
      )}
    </div>
  );
}

export default SearchBarDb;
