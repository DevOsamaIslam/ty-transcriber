#!/usr/bin/env node
import { stdin as input, stdout as output } from "node:process";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import {
  parseYouTubeUrl,
  isPlaylist,
  extractId,
  type ParsedUrl,
} from "../app/modules/url";
import { fetchPlaylist } from "../app/modules/playlist";
import {
  fetchYouTubeTranscript,
  TranscriptNotFoundError,
  fetchVideoMetadata,
} from "../app/modules/youtube";
import {
  downloadAudio,
  decodeAudioToPCM,
  transcribeWithWhisper,
  cleanupAudio,
} from "../app/modules/whisper";
import { formatTranscript } from "../app/modules/openrouter";
import type { TranscriptSources } from "../app/modules/openrouter";
import { writeMarkdownFile, slugify } from "../app/modules/doc";

async function main(): Promise<void> {
  const rl = createInterface({ input, output });
  rl.on("SIGINT", () => {
    console.log("\nCancelled.");
    process.exit(130);
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const onClose = () => reject(new Error("No input received (stdin closed)."));
      rl.once("close", onClose);
      rl.question(question).then(
        (answer) => {
          rl.removeListener("close", onClose);
          resolve(answer);
        },
        (err) => {
          rl.removeListener("close", onClose);
          reject(err);
        }
      );
    });

  try {
    // 0. Ask for the URL (re-ask until it parses as a video or playlist).
    let url = "";
    while (!url) {
      const answer = (await ask("Paste a YouTube video or playlist URL: ")).trim();
      if (!answer) {
        console.log("  Please enter a URL.");
        continue;
      }
      try {
        parseYouTubeUrl(answer);
        url = answer;
      } catch (err) {
        console.log(`  ${err instanceof Error ? err.message : "Invalid URL."}`);
      }
    }
    const parsed = parseYouTubeUrl(url);

    // 0.5. Ask for the transcript language (optional). When left empty, the
    //    video's default language is used (captions default track or
    //    Whisper auto-detection).
    const languageAnswer = (await ask("Transcript language (optional, e.g. en/es/fr): ")).trim();
    const language = languageAnswer || undefined;

    // --format flag: when set, the transcript is fed through the LLM
    // formatter before saving. Defaults to off (raw transcript saved).
    const format = process.argv.includes("--format");

    if (isPlaylist(parsed)) {
      await handlePlaylist(parsed, language, format);
    } else {
      await handleVideo(url, language, format);
    }
  } catch (err) {
    console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

/** Single video: metadata → captions (skipping download/transcript when found)
 *  → Whisper fallback → (optional) LLM formatting → markdown file under
 *  transcripts/<channel>/. Set `format` to feed the transcript through the
 *  formatter before saving. */
async function handleVideo(
  url: string,
  language?: string,
  format = false
): Promise<void> {
  const videoId = extractId(parseYouTubeUrl(url));
  const totalSteps = format ? 5 : 4;

  // 1. Metadata.
  console.log(`\n[1/${totalSteps}] Fetching video metadata…`);
  const metadata = await fetchVideoMetadata(url);
  console.log(
    `  • ${metadata.title} — ${metadata.channel}${
      metadata.channelId ? ` (${metadata.channelId})` : ""
    }${metadata.uploadDate ? ` · uploaded ${metadata.uploadDate}` : ""}`
  );

  // 2. Search for the existing transcript (YouTube captions). When found,
  //    they are the cheapest, most accurate source — skip download + Whisper.
  console.log(`\n[2/${totalSteps}] Searching for an existing transcript…`);
  const sources: TranscriptSources = {};
  try {
    sources.captions = await fetchYouTubeTranscript(videoId, { language });
    console.log("  ✓ Found captions — download/transcription skipped.");
  } catch (err) {
    const reason =
      err instanceof TranscriptNotFoundError
        ? "no captions available"
        : err instanceof Error
          ? err.message
          : String(err);
    console.warn(`  ⚠ ${reason}`);

    // 3. No captions — extract the transcript with Whisper.
    console.log(`\n[3/${totalSteps}] Extracting audio with Whisper…`);
    const audioPath = await downloadAudio(url);
    console.log(`  • Saved to ${audioPath}`);
    try {
      console.log("  Decoding audio to PCM…");
      const audio = await decodeAudioToPCM(audioPath);
      console.log("  Transcribing with Whisper…");
      sources.whisper = await transcribeWithWhisper(audio, { language });
      if (sources.whisper && sources.whisper.trim()) {
        console.log("  ✓ Transcription complete.");
      } else {
        console.warn("  ⚠ Whisper returned no speech.");
      }
    } finally {
      await cleanupAudio(audioPath);
      console.log("  • Cleaned up temporary audio.");
    }
  }

  if (
    !(sources.captions && sources.captions.trim()) &&
    !(sources.whisper && sources.whisper.trim())
  ) {
    throw new Error(
      "No transcript could be obtained (no captions and Whisper found no speech)."
    );
  }

  let body: string;
  if (format) {
    // 4. Format with the LLM (OpenRouter via the OpenAI SDK).
    console.log(`\n[4/${totalSteps}] Formatting transcript with the LLM…`);
    try {
      body = await formatTranscript(sources, metadata, language);
      console.log("  ✓ Formatted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠ Skipping LLM formatting: ${message}`);
      body = [sources.captions, sources.whisper].filter(Boolean).join("\n\n");
    }
  } else {
    body = [sources.captions, sources.whisper].filter(Boolean).join("\n\n");
  }

  // Save the markdown doc.
  const saveStep = format ? 5 : 4;
  console.log(`\n[${saveStep}/${totalSteps}] Saving markdown document…`);
  // Save under the channel name.
  const dir = join("transcripts", slugify(metadata.channel));
  const filePath = await writeMarkdownFile(metadata, videoId, body, dir);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  console.log(`  ✓ Saved ${resolve(filePath)}`);
  console.log(`\nDone! ${body.length} characters, ${words} words.\n`);
}

/** Playlist: fetch every video, find their captions, download + transcribe
 *  only the ones without captions (telling when it's skipped), and save the
 *  markdown docs under transcripts/<channel>/<playlist>/ . When `format` is
 *  set, each transcript is fed through the LLM formatter before saving. */
async function handlePlaylist(
  parsed: ParsedUrl,
  language?: string,
  format = false
): Promise<void> {
  console.log("\n[1/2] Listing playlist videos…");
  let info: { id: string; title: string };
  let videos: Array<{ id: string; url: string }>;
  try {
    ({ info, videos } = await fetchPlaylist(parsed.url));
  } catch (err) {
    console.error(
      `  ✗ Could not list playlist videos: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    process.exitCode = 1;
    return;
  }
  console.log(`  • ${videos.length} video(s) in playlist "${info.title}"`);

  const playlistDir = slugify(info.title) || "playlist";
  let channelDir = "";
  let processed = 0;

  for (const [index, video] of videos.entries()) {
    console.log(`\n[${index + 1}/${videos.length}] ${video.id}`);

    // Metadata (title + channel) for this video.
    const metadata = await fetchVideoMetadata(video.url);
    console.log(
      `  • ${metadata.title} — ${metadata.channel}${
        metadata.channelId ? ` (${metadata.channelId})` : ""
      }`
    );
    if (!channelDir) channelDir = slugify(metadata.channel);
    const dir = join("transcripts", channelDir, playlistDir);

    // 2. Captions first — when they exist, download/transcription is skipped.
    const sources: TranscriptSources = {};
    try {
      sources.captions = await fetchYouTubeTranscript(video.id, { language });
      console.log("  ✓ Captions found — download/transcription skipped.");
    } catch (err) {
      const reason =
        err instanceof TranscriptNotFoundError
          ? "no captions available"
          : err instanceof Error
            ? err.message
            : String(err);
      console.warn(`  ⚠ ${reason}`);

      // 3. No captions — download the audio and transcribe with Whisper.
      console.log("  Extracting audio with Whisper…");
      try {
        const audioPath = await downloadAudio(video.url);
        try {
          console.log("  Decoding audio to PCM…");
          const audio = await decodeAudioToPCM(audioPath);
          console.log("  Transcribing with Whisper…");
          sources.whisper = await transcribeWithWhisper(audio, { language });
          if (sources.whisper && sources.whisper.trim()) {
            console.log("  ✓ Transcription complete.");
          } else {
            console.warn("  ⚠ Whisper returned no speech.");
          }
        } finally {
          await cleanupAudio(audioPath);
          console.log("  • Cleaned up temporary audio.");
        }
      } catch (err2) {
        console.warn(
          `  ⚠ Whisper failed for ${video.id}: ${
            err2 instanceof Error ? err2.message : String(err2)
          }`
        );
        continue;
      }
    }

    if (
      !(sources.captions && sources.captions.trim()) &&
      !(sources.whisper && sources.whisper.trim())
    ) {
      console.warn(`  ⚠ No transcript could be obtained for ${video.id}; skipping.`);
      continue;
    }

    let body: string;
    if (format) {
      // Format with the LLM (OpenRouter via the OpenAI SDK).
      console.log("  Formatting transcript with the LLM…");
      try {
        body = await formatTranscript(sources, metadata, language);
        console.log("  ✓ Formatted.");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠ Skipping LLM formatting: ${message}`);
        body = [sources.captions, sources.whisper].filter(Boolean).join("\n\n");
      }
    } else {
      body = [sources.captions, sources.whisper].filter(Boolean).join("\n\n");
    }

    // Save under transcripts/<channel>/<playlist>/.
    try {
      const filePath = await writeMarkdownFile(metadata, video.id, body, dir);
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      console.log(`  ✓ Saved ${resolve(filePath)}`);
      processed++;
    } catch (err) {
      console.warn(
        `  ⚠ Failed to save ${video.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  console.log(
    `\nDone! ${processed}/${videos.length} video(s) saved under transcripts/${channelDir}/${playlistDir}/`
  );
}

await main();