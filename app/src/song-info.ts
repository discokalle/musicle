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
  //For Spotify songs that are uploaded by small artists themselves
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

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function getRandomUnusedFallback(): string | null {
  const unused = FALLBACK_ISRCS.filter((isrc) => !usedFallbacks.has(isrc));
  if (unused.length === 0) {
    console.warn("No more unused fallback ISRCs available.");
    return null;
  }

  const random = unused[Math.floor(Math.random() * unused.length)];
  usedFallbacks.add(random);
  return random;
}

export async function getInfoByISRC(isrc: string): Promise<SongInfo | null> {
  //First attempt with the original ISRC
  const songInfo = await tryFetchISRCInfo(isrc);
  if (songInfo) return songInfo;

  console.log(`Original ISRC '${isrc}' failed. Attempting fallback...`);
  //If the original ISRC failed, try one random fallback ISRC that hasn't been used
  const fallback = getRandomUnusedFallback();
  if (!fallback) {
    console.warn("No fallback ISRC to try.");
    return null;
  }

  console.log(`Trying fallback ISRC: ${fallback}`);
  const fallbackInfo = await tryFetchISRCInfo(fallback);
  if (fallbackInfo) return fallbackInfo;

  console.warn(`Fallback ISRC '${fallback}' also failed to fetch song info.`);
  return null;
}

async function tryFetchISRCInfo(isrc: string): Promise<SongInfo | null> {
  //Respect MusicBrainz rate limit: 1 request per second.
  //Add a slight buffer (e.g., 1100ms) to be safe.
  //Without this, MusicBrainz stops all requests.
  await delay(1100);

  let data;
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`
    );

    if (!res.ok) {
      console.error(
        `MusicBrainz API recording lookup failed for ISRC ${isrc}: ${res.status} ${res.statusText}`
      );
      return null;
    }
    data = await res.json();
  } catch (error) {
    console.error(
      `Network or parsing error for recording ISRC ${isrc}:`,
      error
    );
    return null;
  }

  if (!data.recordings || data.recordings.length === 0) {
    return null;
  }

  // Sometimes there are re-releases, but we want the earliest release.
  let earliestRecording = null;
  for (const rec of data.recordings) {
    if (rec["first-release-date"]) {
      if (
        !earliestRecording ||
        new Date(rec["first-release-date"]) <
          new Date(earliestRecording["first-release-date"])
      ) {
        earliestRecording = rec;
      }
    }
  }

  if (!earliestRecording) {
    console.warn(
      `No earliest recording with a valid release date found for ISRC: ${isrc}`
    );
    return null;
  }

  const title = earliestRecording.title;
  const artistCredit = earliestRecording["artist-credit"]?.[0];

  if (
    !title ||
    !artistCredit ||
    !artistCredit.name ||
    !artistCredit.artist?.id
  ) {
    console.warn(
      `Missing critical song info (title, artist, or artistId) for ISRC: ${isrc}`
    );
    return null;
  }

  const artist = artistCredit.name;
  const artistId = artistCredit.artist.id;
  const releaseDate = earliestRecording["first-release-date"];

  //Add delay before fetching artist info to respect rate limits
  await delay(1100);

  let artistDetails;
  try {
    artistDetails = await fetchArtistInfoById(artistId);
  } catch (error) {
    console.error(`Error fetching artist details for ID ${artistId}:`, error);
    artistDetails = {};
  }

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
  let data;
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/artist/${artistId}?fmt=json`
    );

    if (!res.ok) {
      console.error(
        `MusicBrainz API artist lookup failed for ID ${artistId}: ${res.status} ${res.statusText}`
      );
      return {};
    }
    data = await res.json();
  } catch (error) {
    console.error(`Network or parsing error for artist ID ${artistId}:`, error);
    return {};
  }

  return {
    activeArea: data["area"]?.name,
    beginArea: data["begin-area"]?.name,
    beginYear: data["life-span"]?.begin, //Birth year for person; first formation year for group.
  };
}
