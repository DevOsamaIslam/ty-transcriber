import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

var mockHolder: {
  parseYouTubeUrl: ReturnType<typeof vi.fn>;
  fetchYouTubeTranscript: ReturnType<typeof vi.fn>;
  transcribeAudio: ReturnType<typeof vi.fn>;
  saveTranscript: ReturnType<typeof vi.fn>;
};

vi.mock("youtube-transcript", async (importOriginal) => {
  const actual = await importOriginal<typeof import("youtube-transcript")>();
  return {
    ...actual,
    fetchTranscript: vi.fn(),
  };
});

vi.mock("../url", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../url")>();
  mockHolder = mockHolder || {};
  mockHolder.parseYouTubeUrl = vi.fn();
  return {
    ...actual,
    parseYouTubeUrl: mockHolder.parseYouTubeUrl,
  };
});

vi.mock("../youtube", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../youtube")>();
  mockHolder = mockHolder || {};
  mockHolder.fetchYouTubeTranscript = vi.fn();
  return {
    ...actual,
    fetchYouTubeTranscript: mockHolder.fetchYouTubeTranscript,
  };
});

vi.mock("../whisper", () => {
  mockHolder = mockHolder || {};
  mockHolder.transcribeAudio = vi.fn();
  return { transcribeAudio: mockHolder.transcribeAudio };
});

vi.mock("../storage", () => {
  mockHolder = mockHolder || {};
  mockHolder.saveTranscript = vi.fn();
  return { saveTranscript: mockHolder.saveTranscript };
});

import { getTranscriptForUrl, TranscriptNotFoundError } from "./index";

beforeEach(() => {
  mockHolder.parseYouTubeUrl.mockReset();
  mockHolder.fetchYouTubeTranscript.mockReset();
  mockHolder.transcribeAudio.mockReset();
  mockHolder.saveTranscript.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getTranscriptForUrl", () => {
  it("returns YouTube transcript when captions are available", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "dQw4w9WgXcQ",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });
    mockHolder.fetchYouTubeTranscript.mockResolvedValue("Hello world transcript");

    const result = await getTranscriptForUrl("https://youtube.com/watch?v=dQw4w9WgXcQ");

    expect(result.transcript).toBe("Hello world transcript");
    expect(result.sourceUrl).toBe("https://youtube.com/watch?v=dQw4w9WgXcQ");
    expect(mockHolder.saveTranscript).toHaveBeenCalled();
  });

  it("falls back to Whisper when YouTube captions are not available", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "no-captions",
      url: "https://youtube.com/watch?v=no-captions",
    });
    mockHolder.fetchYouTubeTranscript.mockRejectedValue(
      new TranscriptNotFoundError("no-captions")
    );
    mockHolder.transcribeAudio.mockResolvedValue("Whisper transcript");

    const result = await getTranscriptForUrl("https://youtube.com/watch?v=no-captions");

    expect(result.transcript).toBe("Whisper transcript");
    expect(mockHolder.transcribeAudio).toHaveBeenCalledWith(
      "https://youtube.com/watch?v=no-captions"
    );
    expect(mockHolder.saveTranscript).toHaveBeenCalled();
  });

  it("throws if both YouTube and Whisper fail", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "fail-all",
      url: "https://youtube.com/watch?v=fail-all",
    });
    mockHolder.fetchYouTubeTranscript.mockRejectedValue(new Error("No transcripts found"));
    mockHolder.transcribeAudio.mockRejectedValue(new Error("Whisper failed"));

    await expect(
      getTranscriptForUrl("https://youtube.com/watch?v=fail-all")
    ).rejects.toThrow();
  });

  it("processes playlist URLs", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "playlist",
      id: "PLabc123",
      url: "https://youtube.com/playlist?list=PLabc123",
    });

    const result = await getTranscriptForUrl("https://youtube.com/playlist?list=PLabc123");

    expect(result.type).toBe("playlist");
  });
});