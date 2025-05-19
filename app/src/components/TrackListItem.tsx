import { TrackData } from "../types";

function TrackListItem(track: TrackData) {
  const containerCSS =
    "list-group-item bg-secondary rounded-md shadow-md/50 px-4 py-2\
    hover:text-accent transition duration-250 grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] items-center gap-5";

  return (
    <li className={containerCSS}>
      <p className="font-bold">{track.name}</p>
      <p>{track.artist}</p>
      <p>{track.album}</p>
      <img
        src={track.albumCoverUrl}
        alt={track.album}
        className="aspect-square w-14 object-cover rounded-md"
      ></img>
    </li>
  );
}

export default TrackListItem;
