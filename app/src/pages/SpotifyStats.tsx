import List from "../components/List";
import TrackListItem from "../components/TrackListItem";

import { TrackData } from "../types";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { DataSnapshot } from "firebase/database";

import { functions } from "../firebase";
import { useOutletContext } from "react-router";

const getTopTracks = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

type ProfileContext = { userSnapshot: DataSnapshot };

function SpotifyStats() {
  const [topTracks, setTopTracks] = useState<TrackData[]>();
  const [isLoading, setIsLoading] = useState(false);

  const { userSnapshot } = useOutletContext<ProfileContext>();

  useEffect(() => {
    const fetchTopTracks = async () => {
      if (userSnapshot?.val().spotify === undefined) {
        return;
      }

      setIsLoading(true);

      const userId = userSnapshot.key;

      if (!userId) return;

      try {
        const res = await getTopTracks({
          userId: userId,
          timeRange: "medium_term",
        });

        if (!res?.data?.topTracks) return;

        setTopTracks(res.data.topTracks);
      } catch (e: any) {
        console.log(e.message, e.response.data);
      }

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
        {topTracks &&
          topTracks.map((item, index) => (
            <TrackListItem key={index} {...item}></TrackListItem>
          ))}
      </List>
    </div>
  );
}

export default SpotifyStats;
