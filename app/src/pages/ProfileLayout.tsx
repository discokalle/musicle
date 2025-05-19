import Button from "../components/Button";
import ProfileBanner from "../components/ProfileBanner";

import spotifyLogo from "../assets/spotify-logo-cartoon.png";

import {
  useParams,
  Link,
  useLocation,
  Outlet,
  useNavigate,
} from "react-router";
import { ref, get, set, DataSnapshot } from "firebase/database";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { auth, db } from "../firebase";

const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const VITE_SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_SCOPES =
  "user-read-private user-read-email playlist-read-private user-top-read \
  user-read-playback-state user-modify-playback-state user-read-currently-playing";

function ProfileLayout() {
  const navigate = useNavigate();
  const { username } = useParams();
  const location = useLocation();
  const [userSnapshot, setUserSnapshot] = useState<DataSnapshot>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/");
    }

    const fetchUser = async () => {
      setIsLoading(true);
      setError("");
      try {
        const snapshot = await get(ref(db, `usernames/${username}`));
        if (snapshot.exists()) {
          const userId = snapshot.val();

          const fetchedUserSnapshot = await get(ref(db, `users/${userId}`));
          setUserSnapshot(fetchedUserSnapshot);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !userSnapshot) {
    return <div>{`Error: ${error}`}</div>;
  }

  const handleConnectSpotify = () => {
    if (!VITE_SPOTIFY_CLIENT_ID || !VITE_SPOTIFY_REDIRECT_URI) {
      alert("Spotify config error.");
      return;
    }

    const state = uuidv4();
    localStorage.setItem("spotify_auth_state", state);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", VITE_SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", VITE_SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append("scope", SPOTIFY_SCOPES);
    authUrl.searchParams.append("state", state);

    window.location.href = authUrl.toString();
  };

  const handleDisconnectSpotify = async () => {
    const isConfirmed = window.confirm("Disconnect Spotify?");
    if (isConfirmed && userSnapshot?.key) {
      await set(ref(db, `users/${userSnapshot.key}/spotify`), null);

      try {
        const updatedSnapshot = await get(ref(db, `users/${userSnapshot.key}`));
        setUserSnapshot(updatedSnapshot);
      } catch (error) {
        console.log("Failed to re-fetch user data:", error);
      }
    }
  };

  const subsecs = [
    ["Overview", `/profile/${username}`],
    ["Followers", `/profile/${username}/followers`],
    ["Following", `/profile/${username}/following`],
    ["Stats", `/profile/${username}/stats`],
  ];

  const containerCSS =
    "w-[50%] text-neutral absolute left-1/2 top-1/6 -translate-x-1/2 flex flex-col gap-5";

  return (
    <div className={containerCSS}>
      <ProfileBanner userSnapshot={userSnapshot}></ProfileBanner>
      <div className="flex justify-between gap-8">
        <div className="panel-card flex items-center justify-between flex-grow">
          {subsecs.map(([secName, secLink]) => {
            return (
              <Link
                key={secName}
                to={secLink}
                className={`link-highlight text-lg ${
                  location.pathname === secLink ? "underline font-bold" : ""
                }`}
              >
                {secName}
              </Link>
            );
          })}
        </div>
        {auth.currentUser?.uid == userSnapshot.key && (
          <Button
            onClick={
              userSnapshot?.val().spotify !== undefined
                ? handleDisconnectSpotify
                : handleConnectSpotify
            }
          >
            <span className="flex items-center gap-2">
              {userSnapshot?.val().spotify !== undefined
                ? "Disconnect"
                : "Connect Spotify"}
              <img
                src={spotifyLogo}
                alt="Spotify Logo"
                className="h-5 w-auto"
              ></img>
            </span>
          </Button>
        )}
      </div>

      <Outlet context={{ userSnapshot }}></Outlet>
    </div>
  );
}

export default ProfileLayout;
