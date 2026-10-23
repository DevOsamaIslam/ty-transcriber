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