import RoundButton from "./RoundButton";

import { httpsCallable } from "firebase/functions";
import { Link } from "react-router";

import { auth, functions } from "../firebase";

import { QueueItemData } from "../types";
import { linkHighlightCSS } from "../styles";

const voteForTrack = httpsCallable<
  { sessionId: string; queueItemId: string },
  { success: boolean }
>(functions, "voteForTrack");

type Props = {
  sessionId: string;
  id: string;
  data: QueueItemData;
  className?: string;
};

function QueueListItem({ sessionId, id, data, className }: Props) {
  const { suggesterUsername, track, voteCount, votes } = data;

  const handleVote = async () => {
    try {
      await voteForTrack({ sessionId, queueItemId: id });
    } catch (e: any) {
      // console.log("Error:", e.message);
    }
  };

  const containerCSS = `${className} list-group-item bg-secondary rounded-md 
    shadow-md/50 px-4 py-2 hover:text-accent transition duration-250 
    grid grid-cols-[0.7fr_1fr_0.7fr_1fr_auto_auto_auto] items-center gap-5`;

  return (
    <li className={containerCSS}>
      <p>
        <Link className={linkHighlightCSS} to={`/profile/${suggesterUsername}`}>
          [{suggesterUsername}]
        </Link>
      </p>
      <p className="font-bold truncate">{track.name}</p>
      <p className="truncate">{track.artist}</p>
      <p className="truncate">{track.album}</p>
      <img
        src={track.albumCoverUrl}
        alt={track.album}
        className="aspect-square w-10 object-cover rounded-md"
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
