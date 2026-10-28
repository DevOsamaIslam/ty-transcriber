import { runCommandWithOutput } from "../../utils/shell";

export interface PlaylistVideo {
  id: string;
  url: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
}

export interface PlaylistFetchResult {
  info: PlaylistInfo;
  videos: PlaylistVideo[];
}

/**
 * Lists the videos of a YouTube playlist without downloading anything.
 * Uses yt-dlp's flat extraction (`--flat-playlist`) with a single JSON dump,
 * so we get every video id + watch URL quickly and cheaply.
 */
export async function fetchPlaylist(playlistUrl: string): Promise<PlaylistFetchResult> {
  const command = `yt-dlp --flat-playlist --dump-single-json --no-warnings --quiet "${playlistUrl}"`;
  const stdout = await runCommandWithOutput(command);

  let data: any;
  try {
    data = JSON.parse(stdout);
  } catch (err) {
    throw new Error(
      `Failed to parse playlist data from yt-dlp: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!data || !Array.isArray(data.entries)) {
    throw new Error(`yt-dlp returned no playlist entries for: ${playlistUrl}`);
  }

  const videos: PlaylistVideo[] = (data.entries as any[])
    .filter(Boolean)
    .map((entry) => ({
      id: entry.id,
      url: entry.url ?? entry.webpage_url ?? `https://www.youtube.com/watch?v=${entry.id}`,
    }))
    .filter((video) => Boolean(video.id));

  const info: PlaylistInfo = {
    id: typeof data.id === "string" ? data.id : "",
    title: typeof data.title === "string" ? data.title : "",
  };

  return { info, videos };
}
