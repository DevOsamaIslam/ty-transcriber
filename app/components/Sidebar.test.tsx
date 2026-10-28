import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import type { Transcript } from "../modules/storage";
import { Sidebar } from "./Sidebar";

const TRANSCRIPTS: Transcript[] = [
  {
    id: "a",
    title: "Video A",
    transcript: "content a",
    sourceUrl: "url-a",
    createdAt: "2024-01-01T00:00:00Z",
    source: "captions",
  },
  {
    id: "b",
    title: "Video B",
    transcript: "content b",
    sourceUrl: "url-b",
    createdAt: "2024-01-02T00:00:00Z",
  },
];

describe("Sidebar", () => {
  it("renders the history heading and each transcript as a link", () => {
    render(
      <MemoryRouter>
        <Sidebar transcripts={TRANSCRIPTS} />
      </MemoryRouter>
    );
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Video A")).toBeInTheDocument();
    expect(screen.getByText("Video B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /video a/i })).toHaveAttribute(
      "href",
      "/transcripts/a",
    );
  });

  it("shows the source and date for each item", () => {
    render(
      <MemoryRouter>
        <Sidebar transcripts={TRANSCRIPTS} />
      </MemoryRouter>
    );
    expect(screen.getByText(/captions/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 2, 2024/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no transcripts", () => {
    render(
      <MemoryRouter>
        <Sidebar transcripts={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/no transcripts/i)).toBeInTheDocument();
  });
});
