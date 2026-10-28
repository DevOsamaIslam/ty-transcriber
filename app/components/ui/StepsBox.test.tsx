import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StepsBox } from "./StepsBox";

describe("StepsBox", () => {
  const STEPS = ["Fetching metadata", "Getting captions", "Formatting", "Saving"];

  it("renders the heading and every step label", () => {
    render(<StepsBox steps={STEPS} activeIndex={0} />);
    expect(screen.getByText(/transcribing/i)).toBeInTheDocument();
    STEPS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("marks steps before the active index as complete", () => {
    render(<StepsBox steps={STEPS} activeIndex={2} />);
    expect(screen.getByText("Fetching metadata")).toBeInTheDocument();
    expect(screen.getByText("Getting captions")).toBeInTheDocument();
    expect(screen.getByText("Formatting")).toBeInTheDocument();
  });

  it("defaults active index to 0", () => {
    render(<StepsBox steps={STEPS} />);
    expect(screen.getByText("Fetching metadata")).toBeInTheDocument();
  });
});
