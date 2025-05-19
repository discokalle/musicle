import List from "../components/List";

import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { DataSnapshot } from "firebase/database";
import { get, ref } from "firebase/database";

import { db } from "../firebase";

type ProfileContext = { userSnapshot: DataSnapshot };

function Followers() {
  const { userSnapshot } = useOutletContext<ProfileContext>();
  const [followers, setFollowers] = useState<string[]>([]);
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
              return snapshot.exists() ? snapshot.val().username : null;
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
      <List>
        {followers.map((flwr, index) => (
          <li className="panel-card" key={index}>
            <Link to={`/profile/${flwr}`} className="link-highlight">
              {flwr}
            </Link>
          </li>
        ))}
      </List>
    </div>
  );
}

export default Followers;
