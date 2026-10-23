import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Surface } from "./Surface";

describe("Surface", () => {
  it("renders children within a surface container", () => {
    render(<Surface>Hello</Surface>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies elevation prop", () => {
    render(<Surface elevation={4}>Hello</Surface>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});