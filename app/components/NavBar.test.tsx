import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { NavBar } from "./NavBar";

describe("NavBar", () => {
  it("renders the app bar with the brand logo", () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /ty-transcriber/i })).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onMenuClick when the mobile menu button is clicked", () => {
    const onMenuClick = vi.fn();
    render(
      <MemoryRouter>
        <NavBar onMenuClick={onMenuClick} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /open history menu/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
