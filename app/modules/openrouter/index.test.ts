import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

var mockHolder: {
  chatCompletionsCreate: ReturnType<typeof vi.fn>;
  clientOptions: any;
};

vi.mock("openai", () => {
  mockHolder = mockHolder || ({} as any);
  mockHolder.chatCompletionsCreate = vi.fn();
  class MockOpenAI {
    chat = {
      completions: { create: mockHolder.chatCompletionsCreate },
    };
    constructor(options: any) {
      mockHolder.clientOptions = options;
    }
  }
  return { default: MockOpenAI };
});

import {
  formatTranscript,
  getOpenRouterModel,
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_BASE_URL,
  OpenRouterError,
} from "./index";

const METADATA = {
  title: "My Video",
  channel: "My Channel",
  url: "https://youtube.com/watch?v=abc123",
};

beforeEach(() => {
  mockHolder.chatCompletionsCreate.mockReset();
  mockHolder.clientOptions = undefined;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getOpenRouterModel", () => {
  it("returns the default free model when OPENROUTER_MODEL is not set", () => {
    expect(getOpenRouterModel()).toBe(DEFAULT_OPENROUTER_MODEL);
  });

  it("uses OPENROUTER_MODEL when set", () => {
    process.env.OPENROUTER_MODEL = "some/model:free";
    expect(getOpenRouterModel()).toBe("some/model:free");
  });
});

describe("formatTranscript", () => {
  it("throws when there are no transcript sources", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";

    await expect(formatTranscript({}, METADATA)).rejects.toThrow(OpenRouterError);
    expect(mockHolder.chatCompletionsCreate).not.toHaveBeenCalled();
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    await expect(
      formatTranscript({ whisper: "raw text" }, METADATA)
    ).rejects.toThrow(OpenRouterError);
    expect(mockHolder.chatCompletionsCreate).not.toHaveBeenCalled();
  });

  it("calls the OpenAI SDK pointed at OpenRouter and returns the formatted text", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    mockHolder.chatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: "# Formatted\n\nNice text." } }],
    });

    const result = await formatTranscript(
      { captions: "caption words", whisper: "whisper words" },
      METADATA
    );

    expect(result).toBe("# Formatted\n\nNice text.");
    expect(mockHolder.clientOptions).toEqual({
      apiKey: "sk-test",
      baseURL: OPENROUTER_BASE_URL,
    });
    const { model, messages } = mockHolder.chatCompletionsCreate.mock.calls[0][0];
    expect(model).toBe(DEFAULT_OPENROUTER_MODEL);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("MERGE");
    const user = String(messages[1].content);
    expect(user).toContain("My Video");
    expect(user).toContain("=== CAPTIONS (YouTube subtitles) ===");
    expect(user).toContain("caption words");
    expect(user).toContain("=== WHISPER EXTRACTION ===");
    expect(user).toContain("whisper words");
  });

  it("includes only the transcript sources that were provided", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    mockHolder.chatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    });

    await formatTranscript({ whisper: "only whisper" }, METADATA);

    const user = String(mockHolder.chatCompletionsCreate.mock.calls[0][0].messages[1].content);
    expect(user).toContain("=== WHISPER EXTRACTION ===");
    expect(user).toContain("only whisper");
    expect(user).not.toContain("CAPTIONS");
  });

  it("throws when the completion has no content", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    mockHolder.chatCompletionsCreate.mockResolvedValue({ choices: [] });

    await expect(
      formatTranscript({ whisper: "raw text" }, METADATA)
    ).rejects.toThrow(OpenRouterError);
  });

  it("propagates API failures", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    mockHolder.chatCompletionsCreate.mockRejectedValue(
      new Error("429 rate limit")
    );

    await expect(
      formatTranscript({ whisper: "raw text" }, METADATA)
    ).rejects.toThrow("429 rate limit");
  });

  it("wraps OpenRouter API errors with status, type and code details", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    const apiErr: any = new Error("400 The model does not support Arabic.");
    apiErr.status = 400;
    apiErr.type = "invalid_request_error";
    apiErr.code = 400;
    apiErr.error = { message: "The model does not support Arabic.", type: "invalid_request_error", code: 400 };
    mockHolder.chatCompletionsCreate.mockRejectedValue(apiErr);

    await expect(
      formatTranscript({ whisper: "raw Arabic text" }, METADATA, "ar")
    ).rejects.toThrow(
      "OpenRouter API request failed [HTTP 400, type: invalid_request_error, code: 400]: 400 The model does not support Arabic."
    );
  });

  it("wraps API errors without a status code", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    const connErr: any = new Error("Connection error.");
    mockHolder.chatCompletionsCreate.mockRejectedValue(connErr);

    await expect(
      formatTranscript({ whisper: "raw text" }, METADATA)
    ).rejects.toThrow(
      "OpenRouter API request failed: Connection error."
    );
  });
});