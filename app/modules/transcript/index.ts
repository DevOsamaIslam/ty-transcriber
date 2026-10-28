import { parseYouTubeUrl, isPlaylist, extractId } from "../url";
import {
  fetchYouTubeTranscript,
  TranscriptNotFoundError,
  getVideoMetadata,
} from "../youtube";
import { transcribeAudio } from "../whisper";
import { saveTranscript } from "../storage";
import { fetchPlaylist } from "../playlist";

export { TranscriptNotFoundError };

export interface TranscriptResult {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
  channel?: string;
  playlistId?: string;
  /** Where the transcript came from: YouTube captions or Whisper. */
  source?: "captions" | "whisper";
  /** True when download/transcription was skipped because captions exist. */
  skipped?: boolean;
  type?: "video" | "playlist";
  /**
   * Language used for the transcript (ISO 639-1, e.g. "en", "es").
   * Undefined means the video's default language was used (captions default
   * track or Whisper auto-detection).
   */
  language?: string;
}

/**
 * Transcribes a single video. Tries YouTube captions first — the cheapest
 * source; when they exist, download + Whisper are skipped. Falls back to
 * Whisper when there are no captions. Persists the result under the video's
 * channel (and playlist, if any).
 */
async function processVideo(
  url: string,
  opts?: { playlistId?: string; language?: string }
): Promise<TranscriptResult> {
  const videoId = extractId(parseYouTubeUrl(url));
  const metadata = await getVideoMetadata(url);
  const language = opts?.language;

  let transcript: string;
  let source: "captions" | "whisper" | undefined;
  let skipped = false;

  try {
    transcript = await fetchYouTubeTranscript(videoId, { language });
    source = "captions";
    skipped = true;
  } catch (err: any) {
    if (!(err instanceof TranscriptNotFoundError)) {
      throw err;
    }
    source = "whisper";
    transcript = await transcribeAudio(url, { language });
  }

  await saveTranscript({
    id: videoId,
    title: metadata.title,
    transcript,
    sourceUrl: url,
    channel: metadata.channel,
    playlistId: opts?.playlistId,
    source,
    language,
  });

  return {
    id: videoId,
    title: metadata.title,
    transcript,
    sourceUrl: url,
    channel: metadata.channel,
    playlistId: opts?.playlistId,
    source,
    skipped,
    language,
  };
}

export async function getTranscriptForUrl(
  url: string,
  opts?: { language?: string }
): Promise<TranscriptResult> {
  const parsed = parseYouTubeUrl(url);

  if (isPlaylist(parsed)) {
    throw new Error(
      "Playlist URLs are not supported by getTranscriptForUrl; use getTranscriptsForPlaylist."
    );
  }

  return processVideo(url, { language: opts?.language });
}

/**
 * Transcribes every video of a playlist: fetches all videos, finds their
 * captions, and downloads + transcribes (Whisper) only the ones that don't
 * have captions — telling when the download/transcript is skipped. Each
 * video is persisted under its channel, inside the playlist directory.
 * A single failing video never aborts the whole playlist.
 */
export async function getTranscriptsForPlaylist(
  playlistUrl: string,
  opts?: { language?: string }
): Promise<TranscriptResult[]> {
  const parsed = parseYouTubeUrl(playlistUrl);

  if (!isPlaylist(parsed)) {
    throw new Error(`Not a YouTube playlist URL: ${playlistUrl}`);
  }

  const { videos } = await fetchPlaylist(playlistUrl);
  const playlistId = extractId(parsed);
  const results: TranscriptResult[] = [];

  for (const video of videos) {
    try {
      results.push(await processVideo(video.url, { playlistId, language: opts?.language }));
    } catch (err) {
      console.error(
        `Failed to transcribe playlist video ${video.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return results;
}