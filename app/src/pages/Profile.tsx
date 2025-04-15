import List from "../components/List";
import StreamListItem from "../components/StreamListItem";
import ProfileBanner from "../components/ProfileBanner";
import SongCardStatic from "../components/SongCardStatic";

import { useParams } from "react-router";
import { ref, get, DataSnapshot } from "firebase/database";
import { useState, useEffect } from "react";

import { db } from "../firebase";

function Profile() {
  const containerCSS =
    "text-neutral absolute flex flex-col left-1/2 top-1/2 transform\
    -translate-x-1/2 -translate-y-1/2 gap-5";

  const { username } = useParams();
  const [userSnapshot, setUserSnapshot] = useState<DataSnapshot>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const snapshot = await get(ref(db, `usernames/${username}`));
        if (snapshot.exists()) {
          const userId = snapshot.val();
          const userSnapshot = await get(ref(db, `users/${userId}`));
          setUserSnapshot(userSnapshot);
        }
      } catch (e: any) {
        return <div>Error fetching user.</div>;
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (isLoading) {
    <div>Loading...</div>;
  }

  if (!userSnapshot) {
    return <div>Cannot find user.</div>;
  }

  // NOTE: will load data from connected service here later
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
  // -------------------

  return (
    <div className={containerCSS}>
      <ProfileBanner userSnapshot={userSnapshot}></ProfileBanner>
      <div className="flex flex-row gap-5 items-start">
        <div className="flex flex-col gap-3">
          <h1 className="text-neutral text-2xl font-bold">Recent Streams</h1>
          <List>
            {items.map((item, index) => (
              <StreamListItem key={index} {...item}></StreamListItem>
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
