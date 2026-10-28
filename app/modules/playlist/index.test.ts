import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

var mockHolder: {
  runCommandWithOutput: ReturnType<typeof vi.fn>;
};

vi.mock("../../utils/shell", () => {
  mockHolder = {} as any;
  mockHolder.runCommandWithOutput = vi.fn();
  return { runCommandWithOutput: mockHolder.runCommandWithOutput };
});

import { fetchPlaylist } from "./index";

beforeEach(() => {
  mockHolder.runCommandWithOutput.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const PLAYLIST_JSON = JSON.stringify({
  id: "PLabc123",
  title: "My Playlist",
  entries: [
    { id: "v1", title: "One", url: "https://youtube.com/watch?v=v1" },
    { id: "v2", title: "Two", webpage_url: "https://youtube.com/watch?v=v2" },
    { title: "Entry without an id" },
  ],
});

describe("fetchPlaylist", () => {
  it("lists every video of the playlist without downloading", async () => {
    mockHolder.runCommandWithOutput.mockResolvedValue(PLAYLIST_JSON);

    const result = await fetchPlaylist("https://youtube.com/playlist?list=PLabc123");

    expect(result.info).toEqual({ id: "PLabc123", title: "My Playlist" });
    expect(result.videos).toEqual([
      { id: "v1", url: "https://youtube.com/watch?v=v1" },
      { id: "v2", url: "https://youtube.com/watch?v=v2" },
    ]);
    const command = String(mockHolder.runCommandWithOutput.mock.calls[0][0]);
    expect(command).toContain("yt-dlp");
    expect(command).toContain("--flat-playlist");
    expect(command).toContain("--dump-single-json");
    expect(command).toContain("list=PLabc123");
  });

  it("falls back to the watch URL built from the video id", async () => {
    mockHolder.runCommandWithOutput.mockResolvedValue(
      JSON.stringify({ id: "PLx", title: "X", entries: [{ id: "v3" }] })
    );

    const result = await fetchPlaylist("https://youtube.com/playlist?list=PLx");

    expect(result.videos).toEqual([{ id: "v3", url: "https://www.youtube.com/watch?v=v3" }]);
  });

  it("throws when yt-dlp returns no entries", async () => {
    mockHolder.runCommandWithOutput.mockResolvedValue(
      JSON.stringify({ id: "PLx", title: "Empty" })
    );

    await expect(fetchPlaylist("https://youtube.com/playlist?list=PLx")).rejects.toThrow(
      /no playlist entries/
    );
  });

  it("throws on invalid yt-dlp output", async () => {
    mockHolder.runCommandWithOutput.mockResolvedValue("not json");

    await expect(fetchPlaylist("https://youtube.com/playlist?list=PLx")).rejects.toThrow();
  });

  it("throws when yt-dlp fails", async () => {
    mockHolder.runCommandWithOutput.mockRejectedValue(new Error("yt-dlp failed"));

    await expect(fetchPlaylist("https://youtube.com/playlist?list=PLx")).rejects.toThrow(
      "yt-dlp failed"
    );
  });
});
