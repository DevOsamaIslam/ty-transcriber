import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { TranscriptCard } from "./TranscriptCard";

describe("TranscriptCard", () => {
  it("renders transcript title and preview", () => {
    render(
      <MemoryRouter>
        <TranscriptCard
          id="abc123"
          title="Test Video"
          preview="This is a preview of the transcript..."
          sourceUrl="https://youtube.com/watch?v=abc123"
          createdAt="2024-01-01T00:00:00Z"
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Video")).toBeInTheDocument();
    expect(screen.getByText(/this is a preview/i)).toBeInTheDocument();
  });

  it("links to the transcript page, card-wide and via the View affordance", () => {
    render(
      <MemoryRouter>
        <TranscriptCard
          id="abc123"
          title="Test Video"
          preview="Preview text"
          sourceUrl="https://youtube.com/watch?v=abc123"
          createdAt="2024-01-01T00:00:00Z"
        />
      </MemoryRouter>
    );
    // The whole card is a link to the transcript page…
    expect(screen.getByRole("link", { name: /test video/i })).toHaveAttribute(
      "href",
      "/transcripts/abc123"
    );
    // …and there is an explicit View affordance linking to the same page.
    expect(screen.getByRole("link", { name: /^view/i })).toHaveAttribute(
      "href",
      "/transcripts/abc123"
    );
  });
});
