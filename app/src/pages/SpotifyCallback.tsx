import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";

function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cleanup = (errorMsg: string) => {
      setError(errorMsg);
      setIsLoading(false);
      localStorage.removeItem("spotify_auth_state");
    };

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const storedState = localStorage.getItem("spotify_auth_state");
      const error = searchParams.get("error");

      if (error) {
        cleanup("Spotify auth failed. ${error}");
        return;
      }

      if (!returnedState || returnedState !== storedState) {
        cleanup(`States do not match! Beware of CSRF attack.`);
        return;
      }

      if (!code) {
        cleanup(`Auth code not returned.`);
        return;
      }

      localStorage.removeItem("spotify_auth_state");

      try {
        // perform code exchange w/ firebase functions

        alert("Spotify connected successfully!");
        navigate("/profile/");
      } catch (e: any) {
        setError("Error during code exchange: ${e.message}");
        setIsLoading(false);
      }
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
