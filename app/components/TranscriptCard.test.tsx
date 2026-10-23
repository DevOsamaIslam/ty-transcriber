import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TranscriptCard } from "./TranscriptCard";

describe("TranscriptCard", () => {
  it("renders transcript title and preview", () => {
    render(
      <TranscriptCard
        id="abc123"
        title="Test Video"
        preview="This is a preview of the transcript..."
        sourceUrl="https://youtube.com/watch?v=abc123"
        createdAt="2024-01-01T00:00:00Z"
      />
    );
    expect(screen.getByText("Test Video")).toBeInTheDocument();
    expect(screen.getByText(/this is a preview/i)).toBeInTheDocument();
  });

  it("has a view button", () => {
    render(
      <TranscriptCard
        id="abc123"
        title="Test Video"
        preview="Preview text"
        sourceUrl="https://youtube.com/watch?v=abc123"
        createdAt="2024-01-01T00:00:00Z"
      />
    );
    expect(screen.getByRole("button", { name: /view/i })).toBeInTheDocument();
  });
});