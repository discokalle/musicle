import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { auth } from "../firebase";

function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasHandledCallback = useRef(false); // to only have the effect run once

  useEffect(() => {
    const cleanup = (errorMsg: string) => {
      setError(errorMsg);
      setIsLoading(false);
      localStorage.removeItem("spotify_auth_state");
    };

    const handleCallback = async () => {
      if (hasHandledCallback.current) return;
      hasHandledCallback.current = true;

      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const storedState = localStorage.getItem("spotify_auth_state");
      const spotifyError = searchParams.get("error");

      if (spotifyError) {
        cleanup(`Spotify auth failed. ${spotifyError}`);
        return;
      }

      if (!returnedState || returnedState !== storedState) {
        cleanup("Returned state does not match stored state!");
        return;
      }

      if (!code) {
        cleanup("Auth code not returned.");
        return;
      }

      localStorage.removeItem("spotify_auth_state");

      try {
        // TO-DO: setup and perform code exchange w/ firebase functions

        alert("Spotify connected successfully!");
        navigate(`/profile/${auth.currentUser?.displayName}`);
      } catch (e: any) {
        setError(`Error during code exchange: ${e.message}`);
      }
      setIsLoading(false);
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (isLoading) {
    return <div>Connecting Spotify account...</div>;
  }

  if (error) {
    alert(`Error: ${error}`);
  }

  return <div>Redirecting...</div>;
}

export default SpotifyCallback;
