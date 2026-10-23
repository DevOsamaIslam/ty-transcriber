export type ParsedUrl = {
  type: "video" | "playlist";
  id: string;
  url: string;
};

const YT_WATCH_REGEX =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const YT_PLAYLIST_REGEX = /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/;

export function parseYouTubeUrl(url: string): ParsedUrl {
  const playlistMatch = url.match(YT_PLAYLIST_REGEX);
  if (playlistMatch) {
    return { type: "playlist", id: playlistMatch[1], url };
  }

  const videoMatch = url.match(YT_WATCH_REGEX);
  if (videoMatch) {
    return { type: "video", id: videoMatch[1], url };
  }

  throw new Error(`Invalid YouTube URL: ${url}`);
}

export function isPlaylist(parsed: ParsedUrl): boolean {
  return parsed.type === "playlist";
}

export function extractId(parsed: ParsedUrl): string {
  return parsed.id;
}