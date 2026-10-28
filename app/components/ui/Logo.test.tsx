import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ThemeProvider } from "@mui/material";
import { Logo } from "./Logo";
import { theme } from "../../root";

describe("Logo", () => {
  it("renders the logo.png asset and product name", () => {
    render(
      <ThemeProvider theme={theme}>
        <Logo />
      </ThemeProvider>
    );
    const mark = screen.getByTestId("logo-mark");
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveAttribute("src", "/logo.png");
    expect(screen.getByText("ty-transcriber")).toBeInTheDocument();
  });

  it("forwards sx and colour to the root element", () => {
    render(
      <ThemeProvider theme={theme}>
        <Logo sx={{ color: "primary.main" }} />
      </ThemeProvider>
    );
    expect(screen.getByTestId("logo")).toHaveStyle("color: rgb(255, 184, 28)");
  });
});
