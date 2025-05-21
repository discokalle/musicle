import defaultProfilePic from "../assets/default-profile-pic.png";

import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { DataSnapshot } from "firebase/database";
import { get, ref } from "firebase/database";
import clsx from "clsx";

import { db } from "../firebase";

import { linkHighlightCSS, panelCardCSS } from "../styles";

type ProfileContext = { userSnapshot: DataSnapshot };

function Followers() {
  const { userSnapshot } = useOutletContext<ProfileContext>();
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!userSnapshot || !userSnapshot.val().followers) {
        setFollowers([]);
        return;
      }

      setIsLoading(true);
      setError("");

      const followersUids = Object.keys(userSnapshot.val().followers);
      try {
        const followerPromises = followersUids.map((uid) =>
          get(ref(db, `users/${uid}`))
        );

        const followerSnapshots = await Promise.all(followerPromises);

        setFollowers(
          followerSnapshots
            .map((snapshot) => {
              return snapshot.exists() ? snapshot.val() : null;
            })
            .filter((follower) => follower !== null)
        );
      } catch (e: any) {
        setError(e.message);
        setFollowers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [userSnapshot]);

  if (isLoading) return <div>Loading...</div>;

  if (error.trim() !== "") return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-neutral text-2xl font-bold">
        Followers ({followers.length})
      </h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {followers.map((follower) => (
          <li
            className={clsx(panelCardCSS, "flex flex-row gap-5 items-center")}
            key={follower.username}
          >
            <Link
              to={`/profile/${follower.username}`}
              className={linkHighlightCSS}
            >
              <img
                src={follower.profilePicture || defaultProfilePic}
                className="h-10 w-10 rounded-md object-cover shadow-md/25"
                alt={follower.username}
              ></img>
            </Link>
            <Link
              to={`/profile/${follower.username}`}
              className={linkHighlightCSS}
            >
              <p>{follower.username}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Followers;
