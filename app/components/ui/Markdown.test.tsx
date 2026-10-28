import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("renders a paragraph", () => {
    render(<Markdown>Hello world</Markdown>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders headings", () => {
    render(<Markdown>{`# Main title

## Section`}</Markdown>);
    expect(screen.getByRole("heading", { level: 1, name: "Main title" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  });

  it("renders bold, italic and inline code", () => {
    render(<Markdown>**bold** and *italic* with `code`</Markdown>);
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
    // Raw markdown syntax must not leak into the rendered output.
    expect(screen.queryByText("**bold** and *italic* with `code`")).not.toBeInTheDocument();
  });

  it("renders an unordered list", () => {
    render(<Markdown>{`- first

- second`}</Markdown>);
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("renders a thematic break", () => {
    render(<Markdown>{`before

---

after`}</Markdown>);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders a link", () => {
    render(<Markdown>[example](https://example.com/page)</Markdown>);
    const link = screen.getByRole("link", { name: "example" });
    expect(link).toHaveAttribute("href", "https://example.com/page");
  });
});