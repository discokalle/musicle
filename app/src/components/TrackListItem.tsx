import { TrackData } from "../types";

type Props = {
  track: TrackData;
  onClickLogic?: () => void;
  includeAlbumName?: boolean;
  className?: string;
};

function TrackListItem({
  track,
  onClickLogic,
  includeAlbumName = true,
  className,
}: Props) {
  const colFormat = includeAlbumName
    ? "grid-cols-[1fr_1fr_1fr_auto]"
    : "grid-cols-[1fr_1fr_auto]";
  const containerCSS = `${className} list-group-item bg-secondary text-neutral 
    rounded-md shadow-md/50 px-4 py-2 transition duration-250 
    grid ${colFormat} items-center gap-5`;

  return (
    <li className={containerCSS} onClick={onClickLogic}>
      <p className="font-bold truncate">{track.name}</p>
      <p>{track.artist}</p>
      {includeAlbumName && <p className="truncate">{track.album}</p>}
      <img
        src={track.albumCoverUrl}
        alt={track.album}
        className="aspect-square w-10 object-cover rounded-md"
      ></img>
    </li>
  );
}

export default TrackListItem;
