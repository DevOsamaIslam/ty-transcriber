import React, { useState } from "react";
import { Form } from "react-router";
import { Box } from "@mui/material";
import { ActionButton } from "./ui/ActionButton";
import { InputField } from "./ui/InputField";

export type UrlFormProps = {
  /**
   * Test/programmatic submit handler. When omitted, the form uses
   * React Router's <Form method="post"> and POSTs `url` to the route action.
   */
  onSubmit?: (url: string) => void;
  /** Shows a spinner and disables the button while the action runs. */
  loading?: boolean;
  /** Error message returned from the route action. */
  serverError?: string | null;
};

const formLayout = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "flex-start",
} as const;

export function UrlForm({ onSubmit, loading, serverError }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const displayError = error ?? serverError ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }
    onSubmit?.(url);
  };

  const fields = (
    <>
      <InputField
        name="url"
        label="YouTube URL"
        placeholder="https://youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={!!displayError}
        helperText={displayError}
        sx={{ flex: 1, minWidth: 240 }}
      />
      <ActionButton type="submit" loading={loading}>
        Transcribe
      </ActionButton>
    </>
  );

  if (onSubmit) {
    // Test/programmatic path: controlled form, no router required.
    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, ...formLayout }}>
        {fields}
      </Box>
    );
  }

  // Production path: POSTs to the index route action (progressive enhancement).
  return (
    <Box sx={{ mb: 4 }}>
      <Form method="post" style={{ ...formLayout }}>
        {fields}
      </Form>
    </Box>
  );
}