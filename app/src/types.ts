export type SessionData = {
  hostUserId: string;
  participants: Record<string, boolean>;
  queue: Record<string, any>;
  createdAt: number;
  isEnded?: boolean;
};

export type TrackData = {
  uri: string;
  name: string;
  artist: string;
  album: string;
  albumCoverUrl: string;
};
