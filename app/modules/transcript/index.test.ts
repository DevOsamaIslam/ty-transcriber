import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

var mockHolder: {
  parseYouTubeUrl: ReturnType<typeof vi.fn>;
  fetchYouTubeTranscript: ReturnType<typeof vi.fn>;
  getVideoMetadata: ReturnType<typeof vi.fn>;
  transcribeAudio: ReturnType<typeof vi.fn>;
  saveTranscript: ReturnType<typeof vi.fn>;
  fetchPlaylist: ReturnType<typeof vi.fn>;
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
  mockHolder.getVideoMetadata = vi.fn();
  return {
    ...actual,
    fetchYouTubeTranscript: mockHolder.fetchYouTubeTranscript,
    getVideoMetadata: mockHolder.getVideoMetadata,
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

vi.mock("../playlist", () => {
  mockHolder = mockHolder || {};
  mockHolder.fetchPlaylist = vi.fn();
  return { fetchPlaylist: mockHolder.fetchPlaylist };
});

import {
  getTranscriptForUrl,
  getTranscriptsForPlaylist,
  TranscriptNotFoundError,
} from "./index";

beforeEach(() => {
  mockHolder.parseYouTubeUrl.mockReset();
  mockHolder.fetchYouTubeTranscript.mockReset();
  mockHolder.getVideoMetadata.mockReset();
  mockHolder.transcribeAudio.mockReset();
  mockHolder.saveTranscript.mockReset();
  mockHolder.fetchPlaylist.mockReset();
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
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "A video",
      channel: "A channel",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });
    mockHolder.fetchYouTubeTranscript.mockResolvedValue("Hello world transcript");

    const result = await getTranscriptForUrl("https://youtube.com/watch?v=dQw4w9WgXcQ");

    expect(result.transcript).toBe("Hello world transcript");
    expect(result.sourceUrl).toBe("https://youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result.channel).toBe("A channel");
    expect(result.source).toBe("captions");
    expect(result.skipped).toBe(true);
    expect(mockHolder.saveTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "dQw4w9WgXcQ",
        channel: "A channel",
        source: "captions",
      })
    );
  });

  it("falls back to Whisper when YouTube captions are not available", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "no-captions",
      url: "https://youtube.com/watch?v=no-captions",
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "No captions",
      channel: "A channel",
      url: "https://youtube.com/watch?v=no-captions",
    });
    mockHolder.fetchYouTubeTranscript.mockRejectedValue(
      new TranscriptNotFoundError("no-captions")
    );
    mockHolder.transcribeAudio.mockResolvedValue("Whisper transcript");

    const result = await getTranscriptForUrl("https://youtube.com/watch?v=no-captions");

    expect(result.transcript).toBe("Whisper transcript");
    expect(result.source).toBe("whisper");
    expect(result.skipped).toBe(false);
    expect(mockHolder.transcribeAudio).toHaveBeenCalledWith(
      "https://youtube.com/watch?v=no-captions",
      { language: undefined }
    );
    expect(mockHolder.saveTranscript).toHaveBeenCalled();
  });

  it("passes the chosen language to captions and stores it", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "es-video",
      url: "https://youtube.com/watch?v=es-video",
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "Español",
      channel: "A channel",
      url: "https://youtube.com/watch?v=es-video",
    });
    mockHolder.fetchYouTubeTranscript.mockResolvedValue("Hola mundo transcript");

    const result = await getTranscriptForUrl(
      "https://youtube.com/watch?v=es-video",
      { language: "es" }
    );

    expect(result.language).toBe("es");
    expect(mockHolder.fetchYouTubeTranscript).toHaveBeenCalledWith(
      "es-video",
      { language: "es" }
    );
    expect(mockHolder.saveTranscript).toHaveBeenCalledWith(
      expect.objectContaining({ language: "es" })
    );
  });

  it("passes the chosen language to Whisper when captions are missing", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "no-captions-es",
      url: "https://youtube.com/watch?v=no-captions-es",
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "No captions ES",
      channel: "A channel",
      url: "https://youtube.com/watch?v=no-captions-es",
    });
    mockHolder.fetchYouTubeTranscript.mockRejectedValue(
      new TranscriptNotFoundError("no-captions-es")
    );
    mockHolder.transcribeAudio.mockResolvedValue("Hola mundo whisper");

    const result = await getTranscriptForUrl(
      "https://youtube.com/watch?v=no-captions-es",
      { language: "es" }
    );

    expect(result.language).toBe("es");
    expect(mockHolder.transcribeAudio).toHaveBeenCalledWith(
      "https://youtube.com/watch?v=no-captions-es",
      { language: "es" }
    );
  });

  it("defaults language to undefined when not provided", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "default-lang",
      url: "https://youtube.com/watch?v=default-lang",
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "Default",
      channel: "A channel",
      url: "https://youtube.com/watch?v=default-lang",
    });
    mockHolder.fetchYouTubeTranscript.mockResolvedValue("Hello world transcript");

    const result = await getTranscriptForUrl("https://youtube.com/watch?v=default-lang");

    expect(result.language).toBeUndefined();
    expect(mockHolder.fetchYouTubeTranscript).toHaveBeenCalledWith(
      "default-lang",
      { language: undefined }
    );
  });

  it("throws if both YouTube and Whisper fail", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "fail-all",
      url: "https://youtube.com/watch?v=fail-all",
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "Fail all",
      channel: "A channel",
      url: "https://youtube.com/watch?v=fail-all",
    });
    mockHolder.fetchYouTubeTranscript.mockRejectedValue(new Error("No transcripts found"));
    mockHolder.transcribeAudio.mockRejectedValue(new Error("Whisper failed"));

    await expect(
      getTranscriptForUrl("https://youtube.com/watch?v=fail-all")
    ).rejects.toThrow();
  });

  it("rejects playlist URLs", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "playlist",
      id: "PLabc123",
      url: "https://youtube.com/playlist?list=PLabc123",
    });

    await expect(
      getTranscriptForUrl("https://youtube.com/playlist?list=PLabc123")
    ).rejects.toThrow(/getTranscriptsForPlaylist/);
  });
});

describe("getTranscriptsForPlaylist", () => {
  const PLAYLIST_URL = "https://youtube.com/playlist?list=PLabc123";

  it("transcribes every video of the playlist", async () => {
    mockHolder.parseYouTubeUrl.mockImplementation((url: string) => {
      if (url.includes("/playlist?list=")) {
        return { type: "playlist", id: "PLabc123", url };
      }
      const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      return { type: "video", id: match?.[1] ?? "unknown", url };
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "T",
      channel: "C",
      url: "",
    });
    mockHolder.fetchPlaylist.mockResolvedValue({
      info: { id: "PLabc123", title: "My Playlist" },
      videos: [
        { id: "v1", url: "https://youtube.com/watch?v=v1" },
        { id: "v2", url: "https://youtube.com/watch?v=v2" },
      ],
    });
    mockHolder.fetchYouTubeTranscript
      .mockResolvedValueOnce("captions one")
      .mockRejectedValueOnce(new TranscriptNotFoundError("v2"));
    mockHolder.transcribeAudio.mockResolvedValue("whisper two");

    const results = await getTranscriptsForPlaylist(PLAYLIST_URL);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "v1",
      title: "T",
      transcript: "captions one",
      sourceUrl: "https://youtube.com/watch?v=v1",
      channel: "C",
      playlistId: "PLabc123",
      source: "captions",
      skipped: true,
    });
    expect(results[1]).toMatchObject({
      id: "v2",
      title: "T",
      transcript: "whisper two",
      sourceUrl: "https://youtube.com/watch?v=v2",
      channel: "C",
      playlistId: "PLabc123",
      source: "whisper",
      skipped: false,
    });
    expect(mockHolder.saveTranscript).toHaveBeenCalledTimes(2);
    expect(mockHolder.saveTranscript.mock.calls[0][0]).toMatchObject({
      playlistId: "PLabc123",
      source: "captions",
    });
    expect(mockHolder.saveTranscript.mock.calls[1][0]).toMatchObject({
      playlistId: "PLabc123",
      source: "whisper",
    });
  });

  it("skips a failing video and continues with the rest", async () => {
    mockHolder.parseYouTubeUrl.mockImplementation((url: string) => {
      if (url.includes("/playlist?list=")) {
        return { type: "playlist", id: "PLabc123", url };
      }
      const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      return { type: "video", id: match?.[1] ?? "unknown", url };
    });
    mockHolder.getVideoMetadata.mockResolvedValue({
      title: "T",
      channel: "C",
      url: "",
    });
    mockHolder.fetchPlaylist.mockResolvedValue({
      info: { id: "PLabc123", title: "My Playlist" },
      videos: [
        { id: "bad", url: "https://youtube.com/watch?v=bad" },
        { id: "ok", url: "https://youtube.com/watch?v=ok" },
      ],
    });
    // Network error on "bad": not a TranscriptNotFoundError → processVideo throws.
    mockHolder.fetchYouTubeTranscript.mockRejectedValueOnce(new Error("Network down"));
    mockHolder.fetchYouTubeTranscript.mockResolvedValueOnce("captions ok");

    const results = await getTranscriptsForPlaylist(PLAYLIST_URL);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ok");
    expect(mockHolder.transcribeAudio).not.toHaveBeenCalled();
  });

  it("throws when the URL is not a playlist", async () => {
    mockHolder.parseYouTubeUrl.mockReturnValue({
      type: "video",
      id: "dQw4w9WgXcQ",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await expect(
      getTranscriptsForPlaylist("https://youtube.com/watch?v=dQw4w9WgXcQ")
    ).rejects.toThrow(/Not a YouTube playlist URL/);
  });
});