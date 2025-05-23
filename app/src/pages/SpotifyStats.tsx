import TrackListItem from "../components/TrackListItem";
import LoadingAnimation from "../components/LoadingAnimation";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { DataSnapshot } from "firebase/database";
import { useOutletContext } from "react-router";

import { functions } from "../firebase";

import { TrackData } from "../types";

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
    return <LoadingAnimation></LoadingAnimation>;
  }

  if (userSnapshot?.val().spotify === undefined) {
    return (
      <h1 className="text-neutral text-xl">{`${
        userSnapshot?.val().username
      } does not have Spotify connected.`}</h1>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-neutral text-2xl font-bold">Top Tracks</h1>
      <ul className="list-group space-y-2">
        {topTracks &&
          topTracks.map((item, index) => (
            <TrackListItem key={index} track={item}></TrackListItem>
          ))}
      </ul>
    </div>
  );
}

export default SpotifyStats;
