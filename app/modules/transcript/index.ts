import { parseYouTubeUrl, isPlaylist, extractId } from "../url";
import { fetchYouTubeTranscript, TranscriptNotFoundError } from "../youtube";
import { transcribeAudio } from "../whisper";
import { saveTranscript } from "../storage";

export { TranscriptNotFoundError };

export interface TranscriptResult {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
  type?: "video" | "playlist";
}

export async function getTranscriptForUrl(url: string): Promise<TranscriptResult> {
  const parsed = parseYouTubeUrl(url);

  if (isPlaylist(parsed)) {
    return {
      id: extractId(parsed),
      title: "Playlist",
      transcript: "",
      sourceUrl: url,
      type: "playlist",
    };
  }

  const videoId = extractId(parsed);
  let transcript: string;

  try {
    transcript = await fetchYouTubeTranscript(videoId);
  } catch (err: any) {
    if (err instanceof TranscriptNotFoundError) {
      transcript = await transcribeAudio(url);
    } else {
      throw err;
    }
  }

  const result: TranscriptResult = {
    id: videoId,
    title: "YouTube Video",
    transcript,
    sourceUrl: url,
  };

  await saveTranscript(result);
  return result;
}