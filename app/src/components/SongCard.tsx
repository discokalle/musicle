type Props = {
  title: string;
  artist: string;
  cover: string;
};

function SongCard({ title, artist, cover }: Props) {
  const cardCSS =
    "bg-secondary rounded-md shadow-md/30 p-2 transform transition duration-300\
     hover:scale-105 hover:shadow-lg/10 flex flex-col items-center";
  const imageDivCSS = "relative w-40 h-40 rounded-md overflow-hidden";
  const imageCSS = "w-full h-full object-cover";
  const textOverlayCSS =
    "absolute inset-0 flex flex-col justify-center items-center bg-transparent\
     opacity-0 hover:opacity-100 transition-opacity duration-300 text-center px-2";
  const titleCSS =
    "text-xl font-bold text-neutral text-shadow-md/50 truncate max-w-38";
  const artistCSS = "text-neutral text-shadow-md/50 truncate max-w-36";

  return (
    <div className={cardCSS}>
      <div className={imageDivCSS}>
        <img src={cover} alt={`${title} cover`} className={imageCSS} />
      </div>
      <div className={textOverlayCSS}>
        <h2 className={titleCSS}>{title}</h2>
        <p className={artistCSS}>{artist}</p>
      </div>
    </div>
  );
}

export default SongCard;
