import RoundButton from "./RoundButton";

import { QueueItemData } from "../types";

import { httpsCallable } from "firebase/functions";

import { auth, functions } from "../firebase";
import { Link } from "react-router";

const voteForTrack = httpsCallable<
  { sessionId: string; queueItemId: string },
  { success: boolean }
>(functions, "voteForTrack");

type Props = {
  sessionId: string;
  id: string;
  data: QueueItemData;
};

function QueueListItem({ sessionId, id, data }: Props) {
  // console.log(data);
  const { suggesterUsername, track, voteCount, votes } = data;

  const handleVote = async () => {
    try {
      await voteForTrack({ sessionId, queueItemId: id });
    } catch (e: any) {
      console.log("Error:", e.message);
    }
  };

  const containerCSS =
    "list-group-item bg-secondary rounded-md shadow-md/50 px-4 py-2\
    hover:text-accent transition duration-250 grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto_auto] items-center gap-5";

  return (
    <li className={containerCSS}>
      <p>
        <Link className="link-highlight" to={`/profile/${suggesterUsername}`}>
          [{suggesterUsername}]
        </Link>
      </p>
      <p className="font-bold">{track.name}</p>
      <p>{track.artist}</p>
      <p>{track.album}</p>
      <img
        src={track.albumCoverUrl}
        alt={track.album}
        className="aspect-square w-14 object-cover rounded-md"
      ></img>
      <RoundButton size="small" onClick={handleVote}>
        {votes && auth.currentUser?.uid && votes[auth.currentUser.uid]
          ? "❌"
          : "❤️"}
      </RoundButton>
      <p>{voteCount}</p>
    </li>
  );
}

export default QueueListItem;
