import TrackListItem from "../components/TrackListItem";
import LoadingAnimation from "../components/LoadingAnimation";
import ArtistCard from "../components/ArtistCard";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { DataSnapshot } from "firebase/database";
import { useOutletContext } from "react-router";

import { functions } from "../firebase";

import { ArtistData, TrackData } from "../types";
import Carousel from "../components/Carousel";

const getTopTracks = httpsCallable<
  { userId: string; timeRange: string },
  { topTracks: TrackData[] }
>(functions, "getTopTracks");

const getTopArtists = httpsCallable<
  { userId: string; timeRange: string },
  { topArtists: ArtistData[] }
>(functions, "getTopArtists");

type ProfileContext = { userSnapshot: DataSnapshot };

function SpotifyStats() {
  const [topTracks, setTopTracks] = useState<TrackData[]>();
  const [topArtists, setTopArtists] = useState<ArtistData[]>();
  const [isLoading, setIsLoading] = useState(false);

  const { userSnapshot } = useOutletContext<ProfileContext>();

  useEffect(() => {
    const fetchTopItems = async () => {
      if (userSnapshot?.val().spotify === undefined) {
        return;
      }

      setIsLoading(true);

      const userId = userSnapshot.key;

      if (!userId) return;

      try {
        const resTracks = await getTopTracks({
          userId: userId,
          timeRange: "short_term",
        });

        const resArtists = await getTopArtists({
          userId: userId,
          timeRange: "short_term",
        });

        if (resTracks?.data?.topTracks) {
          setTopTracks(resTracks.data.topTracks);
        }
        if (resArtists?.data?.topArtists) {
          setTopArtists(resArtists.data.topArtists);
        }
      } catch (e: any) {
        console.log(e.message, e.response.data);
      }

      setIsLoading(false);
    };

    fetchTopItems();
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-neutral text-2xl font-bold">Top Artists</h1>
        <Carousel className="!w-full">
          {topArtists &&
            topArtists.map((item) => (
              <ArtistCard key={item.uri} {...item}></ArtistCard>
            ))}
        </Carousel>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-neutral text-2xl font-bold">Top Tracks</h1>
        <ul className="list-group space-y-2">
          {topTracks &&
            topTracks.map((item, index) => (
              <TrackListItem key={index} track={item}></TrackListItem>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default SpotifyStats;
