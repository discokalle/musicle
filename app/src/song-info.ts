export type SongInfo = {
  title: string;
  artist: string;
  artistId: string;
  releaseDate: string;
  artistActiveArea?: string;
  artistBeginArea?: string;
  artistBeginYear?: string;
};

const FALLBACK_ISRCS = [
  //For spotify songs that are uploaded by small artists themselves
  "USUG11904206",
  "GBAHS1600463",
  "DEUM71807062",
  "USSM12200612",
  "USSM11300080",
  "GBUM72000433",
  "GBN9Y1100088",
  "USSM17700373",
  "GBAYE0601696",
  "USUG11500737",
];

//ISRC codes seem to be universal across services for recordings.

//Track which fallback ISRCs have already been used
const usedFallbacks = new Set<string>();

function getRandomUnusedFallback(): string | null {
  const unused = FALLBACK_ISRCS.filter((isrc) => !usedFallbacks.has(isrc));
  if (unused.length === 0) return null;

  const random = unused[Math.floor(Math.random() * unused.length)];
  usedFallbacks.add(random);
  return random;
}

export async function getInfoByISRC(isrc: string): Promise<SongInfo | null> {
  const songInfo = await tryFetchISRCInfo(isrc);
  if (songInfo) return songInfo;

  //If the original ISRC failed, try one random fallback ISRC that hasn't been used
  const fallback = getRandomUnusedFallback();
  if (!fallback) return null;

  const fallbackInfo = await tryFetchISRCInfo(fallback);
  if (fallbackInfo) return fallbackInfo;

  return null;
}

async function tryFetchISRCInfo(isrc: string): Promise<SongInfo | null> {
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
