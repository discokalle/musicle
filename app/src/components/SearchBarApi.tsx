import { useState, useEffect, useRef } from "react";

import List from "./List";

type Props = {
  apiCall: Function; // a function that makes the api call and returns the results
  matchLogic: Function; // the logic to be used when we search for a query that matches the DB
  renderRec: (rec: any) => React.ReactNode; // the logic for how to render each item in the results
  inputPlaceholderText: string;
  className?: string;
};

function SearchBarApi({
  apiCall,
  matchLogic,
  renderRec,
  inputPlaceholderText,
  className,
}: Props) {
  const [input, setInput] = useState("");
  const [recs, setRecs] = useState<any[]>([]); // recs = recommendations
  const [showRecs, setShowRecs] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const handleMatchAndCleanup = (rec: any) => {
    setRecs([]);
    setShowRecs(false);
    matchLogic(rec);
    setInput("");
  };

  useEffect(() => {
    // used to mark/cancel stale fetchRecs calls (e.g., if an earlier async call
    // finishes after a subsequent call, to avoid that we render the earlier
    // call's results)
    let isCancelled = false;

    // debouce used to avoid making too many API calls if text changes quickly
    let debouceTimeout: NodeJS.Timeout | undefined = undefined;

    const fetchRecs = async (prefix: string) => {
      try {
        console.log(prefix);
        const res = await apiCall(prefix);

        if (isCancelled) return;

        const results = res?.data?.results || [];

        setRecs(results);
        setShowRecs(results.length > 0); // shows recs if there were any results
      } catch (e: any) {
        if (isCancelled) return;
        // alert(`Fetching error: ${e.message}`);
        console.log(`Fetching error: ${e.message}`);
        setRecs([]);
        setShowRecs(false);
      }
    };

    if (debouceTimeout) clearTimeout(debouceTimeout);

    if (input.trim() === "") {
      setRecs([]);
      setShowRecs(false);
      isCancelled = true;
    } else {
      debouceTimeout = setTimeout(() => {
        if (!isCancelled) fetchRecs(input);
      }, 300);
    }

    return () => {
      isCancelled = true;
      clearTimeout(debouceTimeout);
    };
  }, [input, apiCall]);

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
          const val = text.target.value;
          setInput(val);

          if (val.trim() === "") {
            setRecs([]);
            setShowRecs(false);
            return;
          }
        }}
        onFocus={() => input.trim() && recs.length > 0 && setShowRecs(true)}
      ></input>

      {showRecs && recs.length > 0 && (
        <List className={recsCSS}>
          {recs.map((rec, index) => (
            <li
              key={index}
              onClick={() => handleRecClick(rec)}
              className={recItemCSS}
            >
              {renderRec(rec)}
            </li>
          ))}
        </List>
      )}
    </div>
  );
}

export default SearchBarApi;
