import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("youtube-transcript", async (importOriginal) => {
  const actual = await importOriginal<typeof import("youtube-transcript")>();
  return {
    ...actual,
    fetchTranscript: vi.fn(),
  };
});

import { fetchYouTubeTranscript, TranscriptNotFoundError } from "./index";
import * as youtubeTranscript from "youtube-transcript";
import { YoutubeTranscriptNotAvailableError } from "youtube-transcript";

const mockFetchTranscript = youtubeTranscript.fetchTranscript as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetchTranscript.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchYouTubeTranscript", () => {
  it("returns transcript text when captions are available", async () => {
    mockFetchTranscript.mockResolvedValue([
      { text: "Hello world", offset: 0, duration: 5 },
      { text: "This is a test", offset: 5, duration: 4 },
    ]);

    const result = await fetchYouTubeTranscript("dQw4w9WgXcQ");
    expect(result).toBe("Hello world This is a test");
    expect(mockFetchTranscript).toHaveBeenCalledWith("dQw4w9WgXcQ");
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