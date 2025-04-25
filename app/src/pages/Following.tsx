import List from "../components/List";

import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { DataSnapshot } from "firebase/database";
import { get, ref } from "firebase/database";

import { db } from "../firebase";

type ProfileContext = { userSnapshot: DataSnapshot };

function Following() {
  const { userSnapshot } = useOutletContext<ProfileContext>();
  const [following, setFollowing] = useState<string[]>([]);
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
              return snapshot.exists() ? snapshot.val().username : null;
            })
            .filter((follower) => follower !== null)
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
      <List>
        {following.map((flwing, index) => (
          <li className="panel-card">
            <Link
              to={`/profile/${flwing}`}
              key={index}
              className="link-highlight"
            >
              {flwing}
            </Link>
          </li>
        ))}
      </List>
    </div>
  );
}

export default Following;
