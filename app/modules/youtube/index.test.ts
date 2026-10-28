import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("youtube-transcript", async (importOriginal) => {
  const actual = await importOriginal<typeof import("youtube-transcript")>();
  return {
    ...actual,
    fetchTranscript: vi.fn(),
  };
});

import { fetchYouTubeTranscript, getVideoMetadata, TranscriptNotFoundError } from "./index";
import * as youtubeTranscript from "youtube-transcript";
import { YoutubeTranscriptNotAvailableError } from "youtube-transcript";

const mockFetchTranscript = youtubeTranscript.fetchTranscript as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetchTranscript.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fetchYouTubeTranscript", () => {
  it("returns transcript text when captions are available", async () => {
    mockFetchTranscript.mockResolvedValue([
      { text: "Hello world", offset: 0, duration: 5 },
      { text: "This is a test", offset: 5, duration: 4 },
    ]);

    const result = await fetchYouTubeTranscript("dQw4w9WgXcQ");
    expect(result).toBe("Hello world This is a test");
    expect(mockFetchTranscript).toHaveBeenCalledWith("dQw4w9WgXcQ", undefined);
  });

  it("passes the requested language to fetchTranscript", async () => {
    mockFetchTranscript.mockResolvedValue([{ text: "Hola mundo", offset: 0, duration: 3 }]);

    const result = await fetchYouTubeTranscript("dQw4w9WgXcQ", { language: "es" });
    expect(result).toBe("Hola mundo");
    expect(mockFetchTranscript).toHaveBeenCalledWith("dQw4w9WgXcQ", { lang: "es" });
  });

  it("throws TranscriptNotFoundError when captions are not available", async () => {
    mockFetchTranscript.mockRejectedValue(
      new YoutubeTranscriptNotAvailableError("no-captions")
    );

    await expect(fetchYouTubeTranscript("no-captions")).rejects.toThrow(
      TranscriptNotFoundError
    );
  });

  it("throws TranscriptNotFoundError when captions are disabled", async () => {
    mockFetchTranscript.mockRejectedValue(
      new (youtubeTranscript.YoutubeTranscriptDisabledError as any)("no-captions")
    );

    await expect(fetchYouTubeTranscript("no-captions")).rejects.toThrow(
      TranscriptNotFoundError
    );
  });

  it("throws on network errors", async () => {
    mockFetchTranscript.mockRejectedValue(new Error("Network error"));

    await expect(fetchYouTubeTranscript("dQw4w9WgXcQ")).rejects.toThrow(
      "Network error"
    );
  });
});

describe("getVideoMetadata", () => {
  const VIDEO_URL = "https://youtube.com/watch?v=dQw4w9WgXcQ";

  it("returns title, channel and url from the oEmbed API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        title: "Rick Astley – Never Gonna Give You Up",
        author_name: "Rick Astley",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getVideoMetadata(VIDEO_URL);

    expect(result).toEqual({
      title: "Rick Astley – Never Gonna Give You Up",
      channel: "Rick Astley",
      url: VIDEO_URL,
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("youtube.com/oembed");
  });

  it("falls back to placeholders when oEmbed returns a non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    const result = await getVideoMetadata(VIDEO_URL);

    expect(result).toEqual({
      title: "YouTube Video",
      channel: "Unknown",
      url: VIDEO_URL,
    });
  });

  it("falls back to placeholders when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")));

    const result = await getVideoMetadata(VIDEO_URL);

    expect(result).toEqual({
      title: "YouTube Video",
      channel: "Unknown",
      url: VIDEO_URL,
    });
  });
});