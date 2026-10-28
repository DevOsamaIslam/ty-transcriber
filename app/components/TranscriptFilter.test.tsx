import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import React from "react";
import { useSearchParams } from "react-router";
import { TranscriptFilter } from "./TranscriptFilter";

const mockSetSearchParams = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

describe("TranscriptFilter", () => {
  beforeEach(() => {
    mockSetSearchParams.mockClear();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams,
    ]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** MUI v6 renders selects as combobox divs backed by hidden native inputs. */
  const nativeSelects = (): HTMLInputElement[] =>
    Array.from(document.querySelectorAll<HTMLInputElement>("input.MuiSelect-nativeInput"));

  it("renders all filter fields with no active filters", () => {
    render(<TranscriptFilter />);
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByLabelText(/channel/i)).toBeInTheDocument();
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/search/i)).toHaveValue("");
    expect(nativeSelects()[0].value).toBe("");
    expect(nativeSelects()[1].value).toBe("");
  });

  it("updates the search param when the search input changes", () => {
    render(<TranscriptFilter />);
    const input = screen.getByLabelText(/search/i);
    fireEvent.change(input, { target: { value: "lesson" } });
    // Not yet: debounced.
    expect(mockSetSearchParams).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("q")).toBe("lesson");
  });

  it("does not update the search param until 300 ms after typing stops", () => {
    render(<TranscriptFilter />);
    const input = screen.getByLabelText(/search/i);
    fireEvent.change(input, { target: { value: "lesson" } });
    expect(mockSetSearchParams).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(mockSetSearchParams).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("q")).toBe("lesson");
  });

  it("only sends the last value when typing rapidly", () => {
    render(<TranscriptFilter />);
    const input = screen.getByLabelText(/search/i);
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    expect(mockSetSearchParams).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("q")).toBe("abc");
  });

  it("removes the q param when the search input is cleared", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      new URLSearchParams("q=lesson"),
      mockSetSearchParams,
    ]);
    render(<TranscriptFilter />);
    const input = screen.getByLabelText(/search/i);
    fireEvent.change(input, { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("q")).toBeNull();
    expect(params.toString()).toBe("");
  });

  it("updates the source filter", () => {
    render(<TranscriptFilter />);
    fireEvent.change(nativeSelects()[0], { target: { value: "whisper" } });
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("source")).toBe("whisper");
  });

  it("clears the source filter when reset to any", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      new URLSearchParams("source=whisper"),
      mockSetSearchParams,
    ]);
    render(<TranscriptFilter />);
    fireEvent.change(nativeSelects()[0], { target: { value: "" } });
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("source")).toBeNull();
  });

  it("updates the language filter", () => {
    render(<TranscriptFilter />);
    fireEvent.change(nativeSelects()[1], { target: { value: "ar" } });
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("language")).toBe("ar");
  });

  it("updates the channel filter", () => {
    render(<TranscriptFilter />);
    const input = screen.getByLabelText(/channel/i);
    fireEvent.change(input, { target: { value: "My Channel" } });
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.get("channel")).toBe("My Channel");
  });

  it("reflects initial search params in the fields", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      new URLSearchParams("q=test&source=captions&language=en&channel=Foo"),
      mockSetSearchParams,
    ]);
    render(<TranscriptFilter />);
    expect(screen.getByLabelText(/search/i)).toHaveValue("test");
    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("YouTube captions");
    expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("English");
    expect(nativeSelects()[0]).toHaveValue("captions");
    expect(nativeSelects()[1]).toHaveValue("en");
    expect(screen.getByLabelText(/channel/i)).toHaveValue("Foo");
  });

  it("shows a clear button when filters are active and clears them", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      new URLSearchParams("q=test"),
      mockSetSearchParams,
    ]);
    render(<TranscriptFilter />);
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/clear filters/i));
    const params = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(params.toString()).toBe("");
  });
});
