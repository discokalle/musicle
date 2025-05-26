import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";

import { auth, functions } from "../firebase";

import LoadingAnimation from "../components/LoadingAnimation";

const exchangeSpotifyCode = httpsCallable<
  { code: string },
  { success: boolean; message: string }
>(functions, "exchangeSpotifyCode");

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
        const res = await exchangeSpotifyCode({ code: code });

        if ((res.data as any)?.success) {
          alert("Spotify connected successfully!");
          navigate(`/profile/${auth.currentUser?.displayName}`);
        } else {
          const errorMessage =
            (res.data as any)?.message || "An unknown error occurred.";
          throw new Error(`Failed to connect Spotify: ${errorMessage}`);
        }
      } catch (e: any) {
        setError(`Error during code exchange: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, exchangeSpotifyCode]);

  if (isLoading) {
    return <LoadingAnimation message="Connecting Spotify account..." />;
  }

  if (error) {
    alert(`Error: ${error}`);
  }

  return <LoadingAnimation message="Redirecting..." />;
}

export default SpotifyCallback;
