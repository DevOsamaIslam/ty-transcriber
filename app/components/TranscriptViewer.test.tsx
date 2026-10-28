import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { TranscriptViewer } from "./TranscriptViewer";

const transcript = {
  id: "dQw4w9WgXcQ",
  title: "Test Video",
  originalTitle: "Original Test Video",
  transcript: "**Hello** world\n\n- point one\n- point two\n\n`inline code`\n\n> a quote",
  sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  channel: "Test Channel",
  playlistIndex: 1,
  source: "captions" as const,
  language: "en",
  uploadDate: "2024-01-15",
  videoDate: "2024-01-10",
  createdAt: "2024-02-01T10:00:00Z",
};

describe("TranscriptViewer", () => {
  it("renders transcript content", () => {
    render(<TranscriptViewer transcript={transcript} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<TranscriptViewer transcript={transcript} />);
    expect(screen.getByText("Test Video")).toBeInTheDocument();
  });

  it("renders the body as markdown, not raw text", () => {
    render(<TranscriptViewer transcript={transcript} />);
    // Raw markdown syntax must not leak into the rendered output.
    expect(screen.queryByText("**Hello** world")).not.toBeInTheDocument();
    expect(screen.queryByText("`inline code`")).not.toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("point one")).toBeInTheDocument();
    expect(screen.getByText("point two")).toBeInTheDocument();
    expect(screen.getByText("inline code")).toBeInTheDocument();
    expect(screen.getByText("a quote")).toBeInTheDocument();
  });

  it("renders transcript metadata above the body", () => {
    render(<TranscriptViewer transcript={transcript} />);
    expect(screen.getByText("Test Channel")).toBeInTheDocument();
    expect(screen.getByText("YouTube captions")).toBeInTheDocument();
    expect(screen.getByText("en")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: transcript.sourceUrl });
    expect(link).toHaveAttribute("href", transcript.sourceUrl);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("copies the transcript text to the clipboard", () => {
    const writeText = vi.fn();
    vi.stubGlobal(
      "navigator",
      { ...(globalThis as { navigator: unknown }).navigator, clipboard: { writeText } }
    );
    render(<TranscriptViewer transcript={transcript} />);
    fireEvent.click(screen.getByRole("button", { name: /copy to clipboard/i }));
    expect(writeText).toHaveBeenCalledWith(transcript.transcript);
  });
});