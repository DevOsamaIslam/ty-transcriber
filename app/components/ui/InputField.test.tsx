import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { InputField } from "./InputField";

describe("InputField", () => {
  it("renders a text field with label", () => {
    render(<InputField label="YouTube URL" />);
    expect(screen.getByLabelText(/youtube url/i)).toBeInTheDocument();
  });
});