import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildMarkdown,
  docFileName,
  slugify,
  writeMarkdownFile,
  DocMetadata,
} from "./index";

const METADATA: DocMetadata = {
  title: "My Video!",
  channel: "My Channel",
  url: "https://youtube.com/watch?v=abc123",
};

describe("slugify", () => {
  it("lowercases, trims and dashes non-alphanumeric runs", () => {
    expect(slugify("  My Video! Part 2  ")).toBe("my-video-part-2");
    expect(slugify("How_to_write — 2024 (Part 1)")).toBe(
      "how-to-write-2024-part-1"
    );
  });

  it("falls back to 'transcript' when nothing usable remains", () => {
    expect(slugify("!!! $$$")).toBe("transcript");
  });
});

describe("buildMarkdown", () => {
  it("starts with the metadata block (title, channel, url) ahead of the body", () => {
    const md = buildMarkdown(METADATA, "Hello **world**.");

    expect(md).toContain("# My Video!");
    expect(md).toContain("**Channel:** My Channel");
    expect(md).toContain("**URL:** https://youtube.com/watch?v=abc123");
    expect(md).toContain("---");
    expect(md).toContain("Hello **world**.");
    expect(md.indexOf("# My Video!")).toBeLessThan(md.indexOf("Hello"));
  });
});

describe("docFileName", () => {
  it("combines the slugified title with the video id", () => {
    expect(docFileName(METADATA, "abc123")).toBe("my-video-abc123.md");
  });
});

describe("writeMarkdownFile", () => {
  it("writes the built markdown doc and returns its path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ty-transcriber-doc-"));
    try {
      const filePath = await writeMarkdownFile(
        METADATA,
        "abc123",
        "Body text.",
        dir
      );

      expect(filePath).toBe(join(dir, "my-video-abc123.md"));
      const content = await readFile(filePath, "utf8");
      expect(content).toBe(buildMarkdown(METADATA, "Body text."));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});