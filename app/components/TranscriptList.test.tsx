import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { TranscriptList } from "./TranscriptList";

describe("TranscriptList", () => {
  it("shows empty state when no transcripts", () => {
    render(<TranscriptList transcripts={[]} />);
    expect(screen.getByText(/no transcripts/i)).toBeInTheDocument();
  });

  it("renders a card for each transcript", () => {
    const transcripts = [
      {
        id: "a",
        title: "Video A",
        transcript: "content a",
        sourceUrl: "url-a",
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "b",
        title: "Video B",
        transcript: "content b",
        sourceUrl: "url-b",
        createdAt: "2024-01-02T00:00:00Z",
      },
    ];
    render(
      <MemoryRouter>
        <TranscriptList transcripts={transcripts} />
      </MemoryRouter>
    );
    expect(screen.getByText("Video A")).toBeInTheDocument();
    expect(screen.getByText("Video B")).toBeInTheDocument();
  });
});
