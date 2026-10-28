import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";

import { runCommandWithOutput } from "../../utils/shell";

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

/**
 * Options for fetching a YouTube transcript.
 */
export interface FetchYouTubeTranscriptOptions {
  /**
   * ISO 639-1 language code (e.g. "en", "es", "fr") for the captions.
   * When omitted, English is tried first as a sensible "auto-detect"
   * default; if English captions aren't available, the video's default
   * caption language is used (the library's first caption track).
   */
  language?: string;
}

/** Fetches segments and joins them into a single transcript string. */
async function fetchAndJoin(
  videoId: string,
  config: { lang: string } | undefined
): Promise<string> {
  const segments = await fetchTranscript(videoId, config);
  if (!segments || segments.length === 0) {
    throw new TranscriptNotFoundError(videoId);
  }
  return segments.map((s) => s.text).join(" ");
}

export async function fetchYouTubeTranscript(
  videoId: string,
  opts?: FetchYouTubeTranscriptOptions
): Promise<string> {
  // When no language is specified, try English first as a sensible
  // "auto-detect" default. The library otherwise picks the first caption
  // track (captionTracks[0]), which may be in a different language than
  // the video (e.g. Arabic auto-captions listed before English captions).
  const triedEnglishDefault = !opts?.language;
  const config = triedEnglishDefault ? { lang: "en" } : { lang: opts.language };

  try {
    return await fetchAndJoin(videoId, config);
  } catch (err: any) {
    if (err instanceof TranscriptNotFoundError) {
      throw err;
    }
    // English was tried as an "auto-detect" default but isn't available;
    // fall back to no language hint so the library picks YouTube's default track.
    if (
      triedEnglishDefault &&
      err instanceof YoutubeTranscriptNotAvailableLanguageError
    ) {
      try {
        return await fetchAndJoin(videoId, undefined);
      } catch (fallbackErr: any) {
        if (fallbackErr instanceof TranscriptNotFoundError) {
          throw fallbackErr;
        }
        if (UNAVAILABLE_ERRORS.some((cls) => fallbackErr instanceof cls)) {
          throw new TranscriptNotFoundError(videoId);
        }
        throw fallbackErr;
      }
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
  /** YouTube video id (when fetched via yt-dlp). */
  id?: string;
  /** Original title as published on YouTube. */
  originalTitle?: string;
  /** YouTube channel id. */
  channelId?: string;
  /** Video upload date, ISO 8601 (e.g. "2024-01-15"). */
  uploadDate?: string;
  /** Video date, ISO 8601 (e.g. "2024-01-15"). Populated from the upload date. */
  videoDate?: string;
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

/**
 * Parses yt-dlp's `upload_date` (YYYYMMDD) into an ISO date string
 * (YYYY-MM-DD). Returns undefined when the value is missing or malformed.
 */
function parseYtDlpDate(uploadDate: unknown): string | undefined {
  if (typeof uploadDate !== "string" || !/^\d{8}$/.test(uploadDate)) {
    return undefined;
  }
  return `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}`;
}

/**
 * Fetches rich video metadata via yt-dlp's single-JSON dump: video id, title,
 * original title, channel name + id, and upload / video date. Falls back to the
 * lightweight oEmbed metadata (title + channel) when yt-dlp is unavailable or
 * fails, so callers always get a usable result.
 */
export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  try {
    const stdout = await runCommandWithOutput(
      `yt-dlp --dump-single-json --no-warnings --quiet "${url}"`
    );
    const entry = JSON.parse(stdout) as Record<string, unknown>;
    const uploadDate = parseYtDlpDate(entry.upload_date);
    return {
      id: typeof entry.id === "string" ? entry.id : undefined,
      title: typeof entry.title === "string" ? entry.title : "",
      originalTitle:
        typeof entry.title === "string" ? entry.title : undefined,
      channel:
        typeof entry.channel === "string"
          ? entry.channel
          : typeof entry.uploader === "string"
            ? entry.uploader
            : "",
      channelId: typeof entry.channel_id === "string" ? entry.channel_id : undefined,
      uploadDate: uploadDate ?? undefined,
      videoDate: uploadDate ?? undefined,
      url,
    };
  } catch {
    const meta = await getVideoMetadata(url);
    return { title: meta.title, channel: meta.channel, url: meta.url };
  }
}