#!/usr/bin/env node
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseYouTubeUrl, isPlaylist, extractId } from "../app/modules/url";
import {
  fetchYouTubeTranscript,
  TranscriptNotFoundError,
  getVideoMetadata,
} from "../app/modules/youtube";
import {
  downloadAudio,
  decodeAudioToPCM,
  transcribeWithWhisper,
  cleanupAudio,
} from "../app/modules/whisper";
import { formatTranscript } from "../app/modules/openrouter";
import type { TranscriptSources } from "../app/modules/openrouter";
import { writeMarkdownFile } from "../app/modules/doc";

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
    // 0. Ask for the URL (re-ask until it parses as a single video).
    let url = "";
    while (!url) {
      const answer = (await ask("Paste a YouTube video URL: ")).trim();
      if (!answer) {
        console.log("  Please enter a URL.");
        continue;
      }
      try {
        const parsed = parseYouTubeUrl(answer);
        if (isPlaylist(parsed)) {
          console.log("  Playlists are not supported; enter a single video URL.");
          continue;
        }
        url = answer;
      } catch (err) {
        console.log(`  ${err instanceof Error ? err.message : "Invalid URL."}`);
      }
    }
    const videoId = extractId(parseYouTubeUrl(url));

    // 1. Metadata.
    console.log("\n[1/5] Fetching video metadata…");
    const metadata = await getVideoMetadata(url);
    console.log(`  • ${metadata.title} — ${metadata.channel}`);

    // 2. Search for the existing transcript (YouTube captions). When found,
    //    they are the cheapest, most accurate source — skip download + Whisper.
    console.log("\n[2/5] Searching for an existing transcript…");
    const sources: TranscriptSources = {};
    try {
      sources.captions = await fetchYouTubeTranscript(videoId);
      console.log("  ✓ Found captions.");
    } catch (err) {
      const reason =
        err instanceof TranscriptNotFoundError
          ? "no captions available"
          : err instanceof Error
            ? err.message
            : String(err);
      console.warn(`  ⚠ ${reason}`);

      // 3. No captions — extract the transcript with Whisper.
      console.log("\n[3/5] Extracting audio with Whisper…");
      const audioPath = await downloadAudio(url);
      console.log(`  • Saved to ${audioPath}`);
      try {
        console.log("  Decoding audio to PCM…");
        const audio = await decodeAudioToPCM(audioPath);
        console.log("  Transcribing with Whisper…");
        sources.whisper = await transcribeWithWhisper(audio);
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

    // 4. Format with the LLM (OpenRouter via the OpenAI SDK).
    console.log("\n[4/5] Formatting transcript with the LLM…");
    let body: string;
    try {
      body = await formatTranscript(sources, metadata);
      console.log("  ✓ Formatted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠ Skipping LLM formatting: ${message}`);
      body = [sources.captions, sources.whisper].filter(Boolean).join("\n\n");
    }

    // 5. Save the markdown doc.
    console.log("\n[5/5] Saving markdown document…");
    const filePath = await writeMarkdownFile(metadata, videoId, body);
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    console.log(`  ✓ Saved ${resolve(filePath)}`);
    console.log(`\nDone! ${body.length} characters, ${words} words.\n`);
  } catch (err) {
    console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();