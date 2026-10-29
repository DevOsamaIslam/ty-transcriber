import { describe, it, expect } from "vitest";
import { formatDate, excerpt } from "./format";

describe("formatDate", () => {
  it("formats ISO dates as a short locale date", () => {
    expect(formatDate("2024-01-02T00:00:00Z")).toMatch(/jan 2, 2024/i);
  });

  it("returns the raw value when the date is invalid", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("excerpt", () => {
  it("collapses whitespace and keeps short text intact", () => {
    expect(excerpt("  hello\n\n  world  ")).toBe("hello world");
  });

  it("truncates long text with an ellipsis", () => {
    const result = excerpt("a".repeat(300), 100);
    expect(result.length).toBeLessThanOrEqual(101);
    expect(result.endsWith("…")).toBe(true);
  });

  it("uses the default max of 180 characters", () => {
    const result = excerpt("b".repeat(400));
    expect(result.length).toBeLessThanOrEqual(181);
    expect(result.endsWith("…")).toBe(true);
  });
});


describe("formatDate", () => {
  it("formats ISO dates as a short locale date", () => {
    expect(formatDate("2024-01-02T00:00:00Z")).toMatch(/jan 2, 2024/i);
  });

  it("returns the raw value when the date is invalid", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("excerpt", () => {
  it("collapses whitespace and keeps short text intact", () => {
    expect(excerpt("  hello\n\n  world  ")).toBe("hello world");
  });

  it("truncates long text with an ellipsis", () => {
    const result = excerpt("a".repeat(300), 100);
    expect(result.length).toBeLessThanOrEqual(101);
    expect(result.endsWith("…")).toBe(true);
  });

  it("uses the default max of 180 characters", () => {
    const result = excerpt("b".repeat(400));
    expect(result.length).toBeLessThanOrEqual(181);
    expect(result.endsWith("…")).toBe(true);
  });
});
