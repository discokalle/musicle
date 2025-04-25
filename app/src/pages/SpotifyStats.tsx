import List from "../components/List";
import StreamListItem from "../components/StreamListItem";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { DataSnapshot } from "firebase/database";

import { functions } from "../firebase";
import { useOutletContext } from "react-router";

const callSpotifyApi = httpsCallable(functions, "callSpotifyApi");

type ProfileContext = { userSnapshot: DataSnapshot };

function SpotifyStats() {
  const [topTracks, setTopTracks] = useState<
    { songName: string; artistName: string; albumName: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const { userSnapshot } = useOutletContext<ProfileContext>();

  useEffect(() => {
    const fetchTopTracks = async () => {
      if (userSnapshot?.val().spotify === undefined) {
        return;
      }

      setIsLoading(true);
      const res = await callSpotifyApi({
        endpoint: "/v1/me/top/tracks",
        method: "GET",
        queryParams: {
          limit: 20,
          time_range: "short_term",
        },
      });

      console.log(res.data);

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
      setIsLoading(false);
    };

    fetchTopTracks();
  }, [userSnapshot]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-neutral text-2xl font-bold">Top Tracks</h1>
      <List>
        {topTracks.map((item, index) => (
          <StreamListItem key={index} {...item}></StreamListItem>
        ))}
      </List>
    </div>
  );
}

export default SpotifyStats;
