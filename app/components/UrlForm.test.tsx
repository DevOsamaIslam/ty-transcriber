import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { UrlForm } from "./UrlForm";

describe("UrlForm", () => {
  it("calls onSubmit with the URL value", async () => {
    const onSubmit = vi.fn();
    render(<UrlForm onSubmit={onSubmit} />);
    
    const input = screen.getByLabelText(/youtube url/i);
    fireEvent.change(input, { target: { value: "https://youtube.com/watch?v=abc123" } });
    
    const button = screen.getByRole("button", { name: /transcribe/i });
    fireEvent.click(button);
    
    expect(onSubmit).toHaveBeenCalledWith("https://youtube.com/watch?v=abc123");
  });
});