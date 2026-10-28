import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LanguageSelect, LANGUAGES } from "./LanguageSelect";

describe("LanguageSelect", () => {
  it("defines 10 languages plus auto-detect", () => {
    expect(LANGUAGES).toHaveLength(11);
    expect(LANGUAGES[0]).toEqual({ code: "", label: "Auto-detect (video's default)" });
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("es");
    expect(codes).toContain("ar");
    expect(codes).toContain("fr");
    expect(codes).toContain("de");
    expect(codes).toContain("pt");
    expect(codes).toContain("it");
    expect(codes).toContain("ru");
    expect(codes).toContain("ja");
    expect(codes).toContain("ko");
  });

  it("renders a combobox", () => {
    render(<LanguageSelect />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("defaults to auto-detect (empty) value", () => {
    render(<LanguageSelect />);

    const select = screen.getByRole("combobox");
    expect(select.textContent.replace(/\u200B/g, "").trim()).toBe("");
  });
});
