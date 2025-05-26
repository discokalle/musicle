import { SongInfo } from "../types";

const FALLBACK_ISRCS = [
  //Fallback for Spotify songs that are uploaded by small artists themselves and dont have any info in MB.
  //Some of the most streamed spotify songs.
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
  "USGF19942501",
  "USSM18100116",
  "USWB10002407",
  "GBCEL1300362",
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

//ISRC codes seem to be universal across services for recordings.
export async function getInfoByISRC(isrc: string): Promise<SongInfo | null> {
  //First attempt with the original ISRC (Almost always succeeds).
  const songInfo = await tryFetchISRCInfo(isrc);
  if (songInfo) return songInfo;

  // console.log(`Original ISRC '${isrc}' failed. Attempting random fallback...`);

  //Pick one random fallback ISRC from the array
  const fallback =
    FALLBACK_ISRCS[Math.floor(Math.random() * FALLBACK_ISRCS.length)];
  // console.log(`Trying fallback ISRC: ${fallback}`);

  const fallbackInfo = await tryFetchISRCInfo(fallback);
  if (fallbackInfo) return fallbackInfo;

  console.warn(`Fallback ISRC '${fallback}' also failed to fetch song info.`);
  return null;
}

async function tryFetchISRCInfo(isrc: string): Promise<SongInfo | null> {
  //Respect MusicBrainz rate limit: 1 request per second.
  //Without this, MusicBrainz stops all requests after a while.
  await delay(1000);

  let data;
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`
    );

    if (!res.ok) {
      // console.error(
      //   `MusicBrainz API recording lookup failed for ISRC ${isrc}: ${res.status} ${res.statusText}`
      // );
      return null;
    }
    data = await res.json();
  } catch (error) {
    // console.error(
    //   `Network or parsing error for recording ISRC ${isrc}:`,
    //   error
    // );
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
    // console.error(`Error fetching artist details for ID ${artistId}:`, error);
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
      // console.error(
      //   `MusicBrainz API artist lookup failed for ID ${artistId}: ${res.status} ${res.statusText}`
      // );
      return {};
    }
    data = await res.json();
  } catch (error) {
    // console.error(`Network or parsing error for artist ID ${artistId}:`, error);
    return {};
  }

  return {
    activeArea: data["area"]?.name,
    beginArea: data["begin-area"]?.name,
    beginYear: data["life-span"]?.begin, //Birth date for person; first formation date for group.
  };
}
