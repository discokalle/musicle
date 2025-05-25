import { ArtistData } from "../types";

function ArtistCard(artistData: ArtistData) {
  const cardCSS =
    "bg-secondary rounded-md shadow-md/30 p-2 transform transition duration-300\
     hover:scale-105 hover:shadow-lg/10 flex flex-col items-center";
  const textOverlayCSS =
    "absolute inset-0 flex flex-col justify-center items-center bg-transparent opacity-0\
     hover:opacity-100 transition-opacity duration-300 text-center px-2";
  const titleCSS =
    "text-xl font-bold text-neutral text-shadow-md/50 truncate max-w-38";

  return (
    <div className={cardCSS}>
      <div className="relative w-40 h-40 rounded-md overflow-hidden">
        <img
          src={artistData.image}
          alt={`${artistData.name} cover`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className={textOverlayCSS}>
        <h2 className={titleCSS}>{artistData.name}</h2>
        <p className="text-neutral text-shadow-md/50 truncate max-w-36">
          {artistData.genres[0]}
        </p>
      </div>
    </div>
  );
}

export default ArtistCard;
