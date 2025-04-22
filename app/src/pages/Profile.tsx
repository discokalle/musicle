import List from "../components/List";
import Button from "../components/Button";
import StreamListItem from "../components/StreamListItem";
import ProfileBanner from "../components/ProfileBanner";
import SongCardStatic from "../components/SongCardStatic";

import { useParams } from "react-router";
import { ref, get, DataSnapshot } from "firebase/database";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { db } from "../firebase";

const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const VITE_SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_SCOPES =
  "user-read-private user-read-email playlist-read-private";

function Profile() {
  const { username } = useParams();
  const [userSnapshot, setUserSnapshot] = useState<DataSnapshot>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError("");
      try {
        const snapshot = await get(ref(db, `usernames/${username}`));
        if (snapshot.exists()) {
          const userId = snapshot.val();
          setUserSnapshot(await get(ref(db, `users/${userId}`)));
        } else {
          throw new Error("User does not exist.");
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

  if (error.trim() !== "" || !userSnapshot) {
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

  // MOCK DATA! NOTE: will load data from connected service here later
  // -------------------
  const items = [
    {
      songName: "Bada Bastu",
      artistName: "Kardu253",
      albumName: "Teal Album 2500",
    },
    {
      songName: "Morning sun",
      artistName: "Isaha123",
      albumName: "Green Album",
    },
    {
      songName: "Åka båt",
      artistName: "Jonsv",
      albumName: "Norrland",
    },
  ];
  const songCardParams = { artist: "jon", title: "åka båt", cover: "" };
  const followers = ["albert", "herbert", "etc"];
  // -------------------

  const containerCSS =
    "text-neutral absolute flex flex-col left-1/2 top-3/4 transform\
  -translate-x-1/2 -translate-y-3/4 gap-5";

  return (
    <div className={containerCSS}>
      <ProfileBanner userSnapshot={userSnapshot}></ProfileBanner>

      <Button onClick={handleConnectSpotify}>Connect Spotify</Button>

      <div className="flex flex-row gap-5 items-start">
        <div className="flex flex-col gap-3">
          <h1 className="text-neutral text-2xl font-bold">Recent Streams</h1>
          <List>
            {items.map((item, index) => (
              <StreamListItem key={index} {...item}></StreamListItem>
            ))}
          </List>
          <h1 className="text-neutral text-2xl font-bold">Followers</h1>
          <List>
            {followers.map((flwr, index) => (
              <li key={index}>{flwr}</li>
            ))}
          </List>
        </div>
        <div className="flex flex-col gap-5">
          <SongCardStatic {...songCardParams}></SongCardStatic>
        </div>
      </div>
    </div>
  );
}

export default Profile;
