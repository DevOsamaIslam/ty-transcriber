import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface DocMetadata {
  title: string;
  channel: string;
  url: string;
}

/** Default directory (relative to the CLI's working directory) for generated docs. */
export const DOC_OUTPUT_DIR = "transcripts";

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "transcript";
}

/**
 * Builds the markdown document: it starts with the relevant metadata
 * (title, channel, url) followed by the formatted transcript body.
 */
export function buildMarkdown(metadata: DocMetadata, body: string): string {
  return [
    `# ${metadata.title}`,
    "",
    `**Channel:** ${metadata.channel}`,
    `**URL:** ${metadata.url}`,
    "",
    "---",
    "",
    body.trim(),
    "",
  ].join("\n");
}

/** `"<slugified title>-<videoId>.md"` — the id suffix disambiguates same-titled videos. */
export function docFileName(metadata: DocMetadata, videoId: string): string {
  return `${slugify(metadata.title)}-${videoId}.md`;
}

export async function writeMarkdownFile(
  metadata: DocMetadata,
  videoId: string,
  body: string,
  dir: string = DOC_OUTPUT_DIR
): Promise<string> {
  const filePath = join(dir, docFileName(metadata, videoId));
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, buildMarkdown(metadata, body), "utf8");
  return filePath;
}