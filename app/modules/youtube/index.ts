import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";

export class TranscriptNotFoundError extends Error {
  constructor(videoId: string) {
    super(`No captions available for video: ${videoId}`);
    this.name = "TranscriptNotFoundError";
  }
}

/**
 * Package error classes that mean "captions unavailable" — these trigger the
 * Whisper fallback instead of surfacing as unexpected failures.
 */
const UNAVAILABLE_ERRORS = [
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptNotAvailableLanguageError,
];

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const segments = await fetchTranscript(videoId);
    if (!segments || segments.length === 0) {
      throw new TranscriptNotFoundError(videoId);
    }
    return segments.map((s) => s.text).join(" ");
  } catch (err: any) {
    if (err instanceof TranscriptNotFoundError) {
      throw err;
    }
    if (UNAVAILABLE_ERRORS.some((cls) => err instanceof cls)) {
      throw new TranscriptNotFoundError(videoId);
    }
    throw err;
  }
}

export interface VideoMetadata {
  title: string;
  channel: string;
  url: string;
}

const YT_OEMBED_URL = "https://www.youtube.com/oembed";

/**
 * Fetches the video's title and channel via YouTube's public oEmbed endpoint
 * (a plain GET — no API key or yt-dlp needed). Never throws: metadata is
 * cosmetic for the CLI, so any failure yields placeholder values instead.
 */
export async function getVideoMetadata(url: string): Promise<VideoMetadata> {
  const fallback: VideoMetadata = { title: "YouTube Video", channel: "Unknown", url };
  try {
    const response = await fetch(`${YT_OEMBED_URL}?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
      return fallback;
    }
    const data: any = await response.json();
    return {
      title: typeof data.title === "string" ? data.title : fallback.title,
      channel: typeof data.author_name === "string" ? data.author_name : fallback.channel,
      url,
    };
  } catch {
    return fallback;
  }
}