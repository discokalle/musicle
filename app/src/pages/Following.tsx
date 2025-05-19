import defaultProfilePic from "../assets/default-profile-pic.png";

import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { DataSnapshot } from "firebase/database";
import { get, ref } from "firebase/database";

import { db } from "../firebase";

type ProfileContext = { userSnapshot: DataSnapshot };

function Following() {
  const { userSnapshot } = useOutletContext<ProfileContext>();
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!userSnapshot || !userSnapshot.val().following) {
        setFollowing([]);
        return;
      }

      setIsLoading(true);
      setError("");

      const followingUids = Object.keys(userSnapshot.val().following);
      try {
        const followingPromises = followingUids.map((uid) =>
          get(ref(db, `users/${uid}`))
        );

        const followingSnapshots = await Promise.all(followingPromises);

        setFollowing(
          followingSnapshots
            .map((snapshot) => {
              return snapshot.exists() ? snapshot.val() : null;
            })
            .filter((follow) => follow !== null)
        );
      } catch (e: any) {
        setError(e.message);
        setFollowing([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowing();
  }, [userSnapshot]);

  if (isLoading) return <div>Loading...</div>;

  if (error.trim() !== "") return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-neutral text-2xl font-bold">
        Following ({following.length})
      </h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {following.map((follow) => (
          <li
            className="panel-card flex flex-row gap-5 items-center"
            key={follow.username}
          >
            <Link to={`/profile/${follow.username}`} className="link-highlight">
              <img
                src={follow.profilePicture || defaultProfilePic}
                className="h-10 w-10 rounded-md object-cover shadow-md/25"
                alt={follow.username}
              ></img>
            </Link>
            <Link to={`/profile/${follow.username}`} className="link-highlight">
              <p>{follow.username}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Following;
