import { describe, it, expect } from "vitest";
import { parseYouTubeUrl, isPlaylist, extractId, type ParsedUrl } from "./index";

describe("parseYouTubeUrl", () => {
  it("parses a standard watch URL as a video", () => {
    const result = parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "video",
      id: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("parses a youtu.be short URL as a video", () => {
    const result = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result.type).toBe("video");
    expect(result.id).toBe("dQw4w9WgXcQ");
  });

  it("parses a playlist URL as a playlist", () => {
    const result = parseYouTubeUrl(
      "https://www.youtube.com/playlist?list=PLabc123"
    );
    expect(result.type).toBe("playlist");
    expect(result.id).toBe("PLabc123");
  });

  it("throws on an invalid URL", () => {
    expect(() => parseYouTubeUrl("not-a-url")).toThrow();
    expect(() => parseYouTubeUrl("https://example.com")).toThrow();
  });
});

describe("isPlaylist", () => {
  it("returns true for playlist type", () => {
    expect(isPlaylist({ type: "playlist", id: "PLx", url: "" })).toBe(true);
  });

  it("returns false for video type", () => {
    expect(isPlaylist({ type: "video", id: "v1", url: "" })).toBe(false);
  });
});

describe("extractId", () => {
  it("returns the id for a parsed URL", () => {
    const parsed: ParsedUrl = { type: "video", id: "abc123", url: "" };
    expect(extractId(parsed)).toBe("abc123");
  });
});