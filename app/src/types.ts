// the following types match the format of the data stored in the Firebase RTDB
export type SessionData = {
  hostUserId: string;
  participants: Record<string, boolean>;
  queue: Record<string, any>;
  createdAt: number;
  deviceId?: string;
  deviceName?: string;
  isEnded?: boolean;
};

export type TrackData = {
  uri: string;
  name: string;
  artist: string;
  album: string;
  albumCoverUrl: string;
};

export type QueueItemData = {
  addedAt: number;
  suggesterUsername: string;
  track: TrackData;
  voteCount: number;
  votes: Record<string, boolean>;
};
