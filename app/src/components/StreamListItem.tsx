interface Props {
  songName: string;
  artistName: string;
  albumName: string;
}

function StreamListItem({ songName, artistName, albumName }: Props) {
  const containerCSS =
    "list-group-item bg-secondary rounded-md shadow-md/25 p-4 hover:text-accent transition duration-250";

  return (
    <li
      className={containerCSS}
      key={songName + " " + artistName + " " + albumName}
    >
      <h1 className="grid grid-cols-3 gap-x-4">
        <span className="font-bold">{songName}</span>
        <span>{artistName}</span>
        <span>{albumName}</span>
      </h1>
    </li>
  );
}

export default StreamListItem;
