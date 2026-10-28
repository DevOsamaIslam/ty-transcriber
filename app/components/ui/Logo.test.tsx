import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the placeholder mark and product name", () => {
    render(<Logo />);
    expect(screen.getByTestId("logo-mark")).toBeInTheDocument();
    expect(screen.getByText("ty-transcriber")).toBeInTheDocument();
  });

  it("forwards sx and colour to the root element", () => {
    render(<Logo sx={{ color: "primary.main" }} />);
    expect(screen.getByTestId("logo")).toHaveStyle("color: rgb(25, 118, 210)");
  });
});
