import { TrackData } from "../types";

type Props = {
  track: TrackData;
  onClickLogic?: () => void;
  includeAlbumName?: boolean;
};

function TrackListItem({
  track,
  onClickLogic,
  includeAlbumName = true,
}: Props) {
  const colFormat = includeAlbumName
    ? "grid-cols-[1fr_1fr_1fr_auto]"
    : "grid-cols-[1fr_1fr_auto]";
  const containerCSS = `list-group-item bg-secondary text-neutral rounded-md shadow-md/50 px-4 py-2
    hover:text-accent transition duration-250 grid ${colFormat} items-center gap-5`;

  return (
    <li className={containerCSS} onClick={onClickLogic}>
      <p className="font-bold">{track.name}</p>
      <p>{track.artist}</p>
      {includeAlbumName && <p>{track.album}</p>}
      <img
        src={track.albumCoverUrl}
        alt={track.album}
        className="aspect-square w-14 object-cover rounded-md"
      ></img>
    </li>
  );
}

export default TrackListItem;
