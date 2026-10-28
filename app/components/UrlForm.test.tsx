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
    
    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://youtube.com/watch?v=abc123",
      language: "",
      format: false,
    });
  });

  it("includes the format flag when the checkbox is checked", async () => {
    const onSubmit = vi.fn();
    render(<UrlForm onSubmit={onSubmit} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    fireEvent.change(urlInput, { target: { value: "https://youtube.com/watch?v=abc123" } });

    const checkbox = screen.getByLabelText(/format with llm/i);
    fireEvent.click(checkbox);

    const button = screen.getByRole("button", { name: /transcribe/i });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://youtube.com/watch?v=abc123",
      language: "",
      format: true,
    });
  });

  it("defaults to empty language and no format when nothing is chosen", async () => {
    const onSubmit = vi.fn();
    render(<UrlForm onSubmit={onSubmit} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    fireEvent.change(urlInput, { target: { value: "https://youtube.com/watch?v=abc123" } });

    const button = screen.getByRole("button", { name: /transcribe/i });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://youtube.com/watch?v=abc123",
      language: "",
      format: false,
    });
  });
});