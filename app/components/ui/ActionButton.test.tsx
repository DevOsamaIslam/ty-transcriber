import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ActionButton } from "./ActionButton";

describe("ActionButton", () => {
  it("renders a button with the given children", () => {
    render(<ActionButton>Click me</ActionButton>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("shows a loading spinner when loading is true", () => {
    render(<ActionButton loading>Submit</ActionButton>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByTestId("action-button-spinner")).toBeInTheDocument();
  });

  it("applies the danger variant", () => {
    render(<ActionButton variant="danger">Delete</ActionButton>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("MuiButton-colorSecondary");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<ActionButton onClick={handleClick}>Click me</ActionButton>);
    screen.getByRole("button", { name: /click me/i }).click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});