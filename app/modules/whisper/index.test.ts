import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

var mockHolder: {
  runCommand: ReturnType<typeof vi.fn>;
  pipeline: ReturnType<typeof vi.fn>;
  removeFile: ReturnType<typeof vi.fn>;
  readFile: ReturnType<typeof vi.fn>;
};

vi.mock("../../utils/shell", () => {
  mockHolder = mockHolder || ({} as any);
  mockHolder.runCommand = vi.fn();
  mockHolder.removeFile = vi.fn();
  return mockHolder;
});

vi.mock("node:fs/promises", () => {
  mockHolder = mockHolder || ({} as any);
  mockHolder.readFile = vi.fn();
  return {
    default: { readFile: mockHolder.readFile },
    readFile: mockHolder.readFile,
  };
});

vi.mock("@xenova/transformers", () => {
  mockHolder = mockHolder || ({} as any);
  mockHolder.pipeline = vi.fn();
  return { pipeline: mockHolder.pipeline };
});

import {
  downloadAudio,
  decodeAudioToPCM,
  transcribeWithWhisper,
  transcribeAudio,
  cleanupAudio,
} from "./index";

const PCM_BYTES = 16; // 4 float32 samples

beforeEach(() => {
  mockHolder.runCommand.mockReset();
  mockHolder.pipeline.mockReset();
  mockHolder.removeFile.mockReset();
  mockHolder.readFile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("downloadAudio", () => {
  it("calls runCommand with yt-dlp arguments and returns the output path", async () => {
    mockHolder.runCommand.mockResolvedValue(undefined);

    const result = await downloadAudio("https://youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toMatch(/\.mp3$/);
    const command = String(mockHolder.runCommand.mock.calls[0][0]);
    expect(command).toContain("yt-dlp");
    expect(command).toContain("--extract-audio");
    expect(command).toContain("dQw4w9WgXcQ");
  });

  it("restricts downloads to the linked video for watch URLs with a list param", async () => {
    mockHolder.runCommand.mockResolvedValue(undefined);

    await downloadAudio(
      "https://www.youtube.com/watch?v=KMoZnbfVgmY&list=PLabc123&index=1"
    );
    const command = String(mockHolder.runCommand.mock.calls[0][0]);
    expect(command).toContain("--no-playlist");
    expect(command).toContain("KMoZnbfVgmY");
  });

  it("throws if runCommand fails", async () => {
    mockHolder.runCommand.mockRejectedValue(new Error("yt-dlp failed"));

    await expect(
      downloadAudio("https://youtube.com/watch?v=dQw4w9WgXcQ")
    ).rejects.toThrow("yt-dlp failed");
  });
});

describe("decodeAudioToPCM", () => {
  it("decodes the mp3 to 16 kHz mono Float32 PCM and removes the pcm temp file", async () => {
    mockHolder.runCommand.mockResolvedValue(undefined);
    mockHolder.readFile.mockResolvedValue(Buffer.alloc(PCM_BYTES));

    const pcm = await decodeAudioToPCM("/tmp/test.mp3");

    expect(pcm).toBeInstanceOf(Float32Array);
    expect(pcm.length).toBe(4);
    const command = String(mockHolder.runCommand.mock.calls[0][0]);
    expect(command).toContain("ffmpeg");
    expect(command).toContain("-ar 16000");
    expect(command).toContain("-ac 1");
    expect(mockHolder.removeFile).toHaveBeenCalledWith("/tmp/test.pcm");
  });
});

describe("transcribeWithWhisper", () => {
  it("loads the model and transcribes raw PCM in 30s chunks", async () => {
    const mockTranscriber = vi.fn().mockResolvedValue({ text: "Hello world" });
    mockHolder.pipeline.mockResolvedValue(mockTranscriber);

    const audio = new Float32Array(4);
    const result = await transcribeWithWhisper(audio);

    expect(result).toBe("Hello world");
    expect(mockHolder.pipeline).toHaveBeenCalledWith(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny"
    );
    expect(mockTranscriber).toHaveBeenCalledWith(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });
  });

  it("throws if Whisper fails", async () => {
    mockHolder.pipeline.mockRejectedValue(new Error("Model load failed"));

    await expect(
      transcribeWithWhisper(new Float32Array(4))
    ).rejects.toThrow("Model load failed");
  });
});

describe("transcribeAudio", () => {
  it("downloads audio, decodes it, transcribes it, and cleans up", async () => {
    mockHolder.runCommand.mockResolvedValue(undefined);
    mockHolder.readFile.mockResolvedValue(Buffer.alloc(PCM_BYTES));

    const mockTranscriber = vi.fn().mockResolvedValue({ text: "Transcribed text" });
    mockHolder.pipeline.mockResolvedValue(mockTranscriber);
    mockHolder.removeFile.mockResolvedValue(undefined);

    const result = await transcribeAudio("https://youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toBe("Transcribed text");
    expect(mockTranscriber).toHaveBeenCalledWith(expect.any(Float32Array), {
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    expect(mockHolder.removeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.mp3$/)
    );
  });
});

describe("cleanupAudio", () => {
  it("deletes the audio file", async () => {
    mockHolder.removeFile.mockResolvedValue(undefined);
    await cleanupAudio("/tmp/test.mp3");
    expect(mockHolder.removeFile).toHaveBeenCalledWith("/tmp/test.mp3");
  });
});