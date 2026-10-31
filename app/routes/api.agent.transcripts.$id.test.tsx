import { beforeEach, describe, expect, it, vi } from "vitest";
import { loader } from "./api.agent.transcripts.$id";
import { getTranscript, type Transcript } from "../modules/storage";

vi.mock("../modules/storage", () => ({
  getTranscript: vi.fn(),
}));

const mockGetTranscript = vi.mocked(getTranscript);

const TRANSCRIPT: Transcript = {
  id: "dQw4w9WgXcQ",
  title: "Test video",
  transcript: "Hello world",
  sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  source: "captions",
  createdAt: new Date().toISOString(),
};

describe("api.agent.transcripts.$id loader", () => {
  beforeEach(() => {
    mockGetTranscript.mockReset();
  });

  it("returns the transcript as JSON for agents", async () => {
    mockGetTranscript.mockResolvedValue(TRANSCRIPT);

    const result = await loader({
      params: { id: TRANSCRIPT.id },
      request: new Request(
        `http://localhost/api/agent/transcripts/${TRANSCRIPT.id}`
      ),
      context: {},
    } as never);

    expect(result).toEqual({ transcript: TRANSCRIPT });
    expect(mockGetTranscript).toHaveBeenCalledWith(TRANSCRIPT.id);
  });

  it("returns 404 when the transcript does not exist", async () => {
    mockGetTranscript.mockResolvedValue(null);

    const result = (await loader({
      params: { id: "missing" },
      request: new Request("http://localhost/api/agent/transcripts/missing"),
      context: {},
    } as never)) as { data: unknown; init?: { status?: number } };

    expect(result.data).toEqual({ error: "Transcript not found" });
    expect(result.init?.status).toBe(404);
  });
});
