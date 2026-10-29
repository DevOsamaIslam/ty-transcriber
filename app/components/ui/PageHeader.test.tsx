import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders title, overline and subtitle", () => {
    render(
      <PageHeader overline="Channel" title="My Channel" subtitle="3 transcripts" />
    );
    expect(screen.getByText("My Channel")).toBeInTheDocument();
    expect(screen.getByText("Channel")).toBeInTheDocument();
    expect(screen.getByText("3 transcripts")).toBeInTheDocument();
  });

  it("renders a back link when backTo is set", () => {
    render(
      <MemoryRouter>
        <PageHeader title="Playlist" backTo={{ to: "/", label: "All transcripts" }} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /all transcripts/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders action content", () => {
    render(
      <PageHeader
        title="Transcript"
        actions={<button type="button">Re-format</button>}
      />
    );
    expect(screen.getByRole("button", { name: /re-format/i })).toBeInTheDocument();
  });
});
