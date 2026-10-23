import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders heading and message", () => {
    render(<EmptyState heading="No transcripts" message="Get started by adding a URL." />);
    expect(screen.getByText(/no transcripts/i)).toBeInTheDocument();
    expect(screen.getByText(/get started by adding a url/i)).toBeInTheDocument();
  });
});