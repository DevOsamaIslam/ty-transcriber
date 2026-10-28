import OpenAI from "openai";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free";

export interface VideoMetadataLike {
  title: string;
  channel: string;
  url: string;
}

/** One or both raw transcript sources captured for the video. */
export interface TranscriptSources {
  captions?: string;
  whisper?: string;
}

export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

const FORMAT_SYSTEM_PROMPT = `You are a professional video-transcript formatter. You will receive the raw,
unformatted transcript of a video as one or more labeled sources (YouTube captions and/or Whisper
speech-to-text) and must REFORMAT it into clean, well-structured Markdown.

Requirements:
- If multiple labeled sources are provided, MERGE them into a single document: prefer the
  most accurate, readable wording and combine complementary content — use captions where
  they are clear, and add speech Whisper caught that captions missed.
- Divide the transcript into logical sections using ## headings, based on topic changes.
- Split the raw words into natural paragraphs.
- Keep the speaker's meaning and information intact. Do not add, remove, or invent any content.
- Remove purely mechanical noise: timestamps, "(music)", "[Music]", repeated false starts, and other transcription-software artifacts.
- Fix obvious spacing/casing artifacts, but do not rewrite sentences.
- Output ONLY the formatted Markdown body. Do not add a title heading, metadata block, summary, or any commentary outside the content.`;

/** Renders the transcript source(s) as labeled blocks for the LLM prompt. */
function listSources(sources: TranscriptSources): string[] {
  const blocks: string[] = [];
  if (sources.captions) {
    blocks.push(`=== CAPTIONS (YouTube subtitles) ===\n${sources.captions}`);
  }
  if (sources.whisper) {
    blocks.push(`=== WHISPER EXTRACTION ===\n${sources.whisper}`);
  }
  return blocks;
}

/** Extracts OpenRouter-specific details from an OpenAI SDK APIError. */
function extractOpenRouterErrorDetails(err: unknown): {
  status?: number;
  type?: string;
  code?: string | null;
} {
  if (!(err instanceof Error)) return {};
  const apiErr = err as any;
  return {
    status: apiErr.status,
    type: apiErr.type,
    code: apiErr.code,
  };
}

export async function formatTranscript(
  sources: TranscriptSources,
  metadata: VideoMetadataLike,
  language?: string
): Promise<string> {
  const blocks = listSources(sources);
  if (blocks.length === 0) {
    throw new OpenRouterError("No transcript sources to format.");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not set; set it to enable the LLM formatting step."
    );
  }

  const client = new OpenAI({ apiKey, baseURL: OPENROUTER_BASE_URL });
  try {
    const completion = await client.chat.completions.create({
      model: getOpenRouterModel(),
      messages: [
        { role: "system", content: FORMAT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Video: ${metadata.title}`,
            `Channel: ${metadata.channel}`,
            `URL: ${metadata.url}`,
            language ? `Language: ${language}` : "",
            "",
            "Transcript source(s) captured:",
            ...blocks,
          ].join("\n"),
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      throw new OpenRouterError("OpenRouter returned an empty completion.");
    }
    return text.trim();
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    const { status, type, code } = extractOpenRouterErrorDetails(err);
    const extras: string[] = [];
    if (status) extras.push(`HTTP ${status}`);
    if (type) extras.push(`type: ${type}`);
    if (code != null) extras.push(`code: ${code}`);
    const suffix = extras.length ? ` [${extras.join(", ")}]` : "";
    const baseMessage = err instanceof Error ? err.message : String(err);
    throw new OpenRouterError(
      `OpenRouter API request failed${suffix}: ${baseMessage}`
    );
  }
}