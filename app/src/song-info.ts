export type SongInfo = {
  title: string;
  artist: string;
  artistId: string;
  releaseDate: string;
  artistActiveArea?: string;
  artistBeginArea?: string;
  artistBeginYear?: string;
};

//ISRC codes seem to be universal across services for recordings.
export async function getInfoByISRC(isrc: string): Promise<SongInfo | null> {
  const res = await fetch(
    `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`
  );
  const data = await res.json();

  if (!data.recordings || data.recordings.length === 0) return null;

  //Sometimes there are re-releases, but we want the earliest release.
  let earliestRecording = null;
  for (const rec of data.recordings) {
    if (rec["first-release-date"]) {
      if (
        !earliestRecording ||
        rec["first-release-date"] < earliestRecording["first-release-date"]
      ) {
        earliestRecording = rec;
      }
    }
  }
  if (!earliestRecording) return null;

  const title = earliestRecording.title;
  const artistCredit = earliestRecording["artist-credit"]?.[0];
  const artist = artistCredit.name;
  const artistId = artistCredit.artist?.id;
  const releaseDate = earliestRecording["first-release-date"];

  const artistDetails = await fetchArtistInfoById(artistId);

  return {
    title,
    artist,
    artistId,
    releaseDate,
    artistActiveArea: artistDetails?.activeArea,
    artistBeginArea: artistDetails?.beginArea,
    artistBeginYear: artistDetails?.beginYear,
  };
}

async function fetchArtistInfoById(artistId: string): Promise<{
  activeArea?: string;
  beginArea?: string;
  beginYear?: string;
}> {
  const res = await fetch(
    `https://musicbrainz.org/ws/2/artist/${artistId}?fmt=json`
  );
  const data = await res.json();

  return {
    activeArea: data["area"]?.name,
    beginArea: data["begin-area"]?.name,
    beginYear: data["life-span"]?.begin, //Birth year for person; first formation year for group.
  };
}
