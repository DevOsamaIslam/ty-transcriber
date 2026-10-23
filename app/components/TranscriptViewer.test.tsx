import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TranscriptViewer } from "./TranscriptViewer";

describe("TranscriptViewer", () => {
  it("renders transcript content", () => {
    render(
      <TranscriptViewer transcript={{ id: "1", title: "Test", transcript: "Hello world", sourceUrl: "url" }} />
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});