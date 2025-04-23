import List from "../components/List";
import Button from "../components/Button";
import StreamListItem from "../components/StreamListItem";
import ProfileBanner from "../components/ProfileBanner";
import SongCardStatic from "../components/SongCardStatic";

import { useParams } from "react-router";
import { ref, get, DataSnapshot } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { auth, db, functions } from "../firebase";

const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const VITE_SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_SCOPES =
  "user-read-private user-read-email playlist-read-private user-top-read";

const callSpotifyApi = httpsCallable(functions, "callSpotifyApi");

function Profile() {
  const { username } = useParams();
  const [userSnapshot, setUserSnapshot] = useState<DataSnapshot>();
  const [hasSpotifyConnected, setHasSpoitfyConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [topTracks, setTopTracks] = useState<
    { songName: string; artistName: string; albumName: string }[]
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopTracks = async (fetchedUserSnapshot: DataSnapshot) => {
      if (fetchedUserSnapshot?.val().spotify !== undefined) {
        setHasSpoitfyConnected(true);

        const res = await callSpotifyApi({
          endpoint: "/v1/me/top/tracks",
          method: "GET",
          queryParams: {
            limit: 5,
            time_range: "short_term",
          },
        });

        let topTracksList = [];
        const data = res?.data as { items: any[] };
        for (const item of data.items) {
          topTracksList.push({
            songName: item.name,
            artistName: item.artists[0].name,
            albumName: item.album.name,
          });
        }
        setTopTracks(topTracksList);
      } else {
        setHasSpoitfyConnected(false);
      }
    };

    const fetchUser = async () => {
      setIsLoading(true);
      setError("");
      setTopTracks([]);
      try {
        const snapshot = await get(ref(db, `usernames/${username}`));
        if (snapshot.exists()) {
          const userId = snapshot.val();

          const fetchedUserSnapshot = await get(ref(db, `users/${userId}`));
          setUserSnapshot(fetchedUserSnapshot);

          fetchTopTracks(fetchedUserSnapshot);
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

  const handleDisconnectSpotify = () => {
    // TO-DO
    return;
  };

  // MOCK DATA! NOTE: will load data from connected service here later
  // -------------------
  const songCardParams = { artist: "jon", title: "åka båt", cover: "" };
  const followers = ["albert", "herbert", "etc"];
  // -------------------

  const containerCSS =
    "w-[50%] text-neutral absolute flex flex-col left-[5%] top-[15%] gap-5";

  return (
    <div className={containerCSS}>
      <ProfileBanner userSnapshot={userSnapshot}></ProfileBanner>

      {auth.currentUser?.uid == userSnapshot.key ? (
        !hasSpotifyConnected ? (
          <Button onClick={handleConnectSpotify}>Connect Spotify</Button>
        ) : (
          <div onClick={handleDisconnectSpotify}>Spotify connected!</div>
        )
      ) : null}

      <div className="flex flex-row gap-5 items-start">
        <div className="flex flex-col gap-3">
          <h1 className="text-neutral text-2xl font-bold">Top Tracks</h1>
          <List>
            {topTracks.map((item, index) => (
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
