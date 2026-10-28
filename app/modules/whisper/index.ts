import { readFile } from "node:fs/promises";
import { pipeline } from "@xenova/transformers";
import { runCommand, removeFile } from "../../utils/shell";

const WHISPER_MODEL = "Xenova/whisper-tiny";
const AUDIO_EXT = ".mp3";

/** Whisper models expect 16 kHz mono audio. */
const PCM_SAMPLE_RATE = 16000;
/**
 * Whisper processes audio in 30-second windows. Without chunking, anything
 * longer than 30s is truncated to the first window, so long recordings must
 * be transcribed chunk-by-chunk.
 */
const CHUNK_LENGTH_S = 30;
const STRIDE_LENGTH_S = 5;

export async function downloadAudio(url: string): Promise<string> {
  const outputPath = `/tmp/yt-audio-${Date.now()}${AUDIO_EXT}`;
  // --no-playlist: watch URLs carrying ?list=...&index=... must download only
  // the linked video, not the entire playlist.
  // --quiet --no-warnings: keep child process output small (exec buffers it).
  const command = `yt-dlp --no-playlist --no-warnings --quiet --extract-audio --audio-format mp3 --output "${outputPath.replace(/\.mp3$/, "")}" "${url}"`;
  await runCommand(command);
  return outputPath;
}

/**
 * transformers.js cannot decode media files in Node (`AudioContext` is
 * unavailable), so the MP3 is decoded to raw 16 kHz mono Float32 PCM with
 * ffmpeg and handed to the pipeline as a `Float32Array`.
 */
export async function decodeAudioToPCM(audioPath: string): Promise<Float32Array> {
  const pcmPath = audioPath.replace(/\.mp3$/, ".pcm");
  await runCommand(
    `ffmpeg -y -i "${audioPath}" -ac 1 -ar ${PCM_SAMPLE_RATE} -f f32le "${pcmPath}"`
  );
  const buffer = await readFile(pcmPath);
  await removeFile(pcmPath);

  // View into the buffer when 4-byte aligned (the common case); otherwise copy.
  const aligned = buffer.byteOffset % 4 === 0 ? buffer : Buffer.from(buffer);
  return new Float32Array(
    aligned.buffer,
    aligned.byteOffset,
    Math.floor(aligned.byteLength / 4)
  );
}

/**
 * Options for transcribing audio with Whisper.
 */
export interface TranscribeWithWhisperOptions {
  /**
   * ISO 639-1 language code (e.g. "en", "es", "fr") to transcribe in.
   * When omitted, Whisper auto-detects the language from the audio.
   */
  language?: string;
}

export async function transcribeWithWhisper(
  audio: Float32Array,
  opts?: TranscribeWithWhisperOptions
): Promise<string> {
  const transcriber = await pipeline("automatic-speech-recognition", WHISPER_MODEL);
  // chunk_length_s is required for audio longer than one 30s window;
  // language is left unset so the model auto-detects it, unless provided.
  const result = await transcriber(audio, {
    chunk_length_s: CHUNK_LENGTH_S,
    stride_length_s: STRIDE_LENGTH_S,
    ...(opts?.language ? { language: opts.language } : {}),
  });
  return typeof result === "string" ? result : result.text;
}

export async function cleanupAudio(audioPath: string): Promise<void> {
  await removeFile(audioPath);
}

export async function transcribeAudio(
  url: string,
  opts?: TranscribeWithWhisperOptions
): Promise<string> {
  const audioPath = await downloadAudio(url);
  try {
    const audio = await decodeAudioToPCM(audioPath);
    return await transcribeWithWhisper(audio, opts);
  } finally {
    await cleanupAudio(audioPath);
  }
}