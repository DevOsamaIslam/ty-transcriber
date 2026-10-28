import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-router";
import { Box } from "@mui/material";
import { ActionButton } from "./ui/ActionButton";
import { InputField } from "./ui/InputField";
import { LanguageSelect } from "./ui/LanguageSelect";
import { StepsBox } from "./ui/StepsBox";

export type UrlFormProps = {
  /**
   * Test/programmatic submit handler. When omitted, the form uses
   * React Router's <Form method="post"> and POSTs `url`, `language` and
   * `format` to the route action.
   */
  onSubmit?: (data: { url: string; language: string; format: boolean }) => void;
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

const TRANSCRIBE_STEPS = [
  "Fetching video metadata",
  "Getting captions / transcribing",
  "Formatting transcript",
  "Saving transcript",
];

export function UrlForm({ onSubmit, loading, serverError }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [format, setFormat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepRef = useRef(0);

  const displayError = error ?? serverError ?? null;

  // While the action is running, animate through the transcribe steps.
  useEffect(() => {
    if (!loading) {
      stepRef.current = 0;
      return;
    }
    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % TRANSCRIBE_STEPS.length;
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }
    onSubmit?.({ url, language, format });
  };

  const displayFields = (
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
      <LanguageSelect
        name="language"
        value={language}
        onChange={(language) => setLanguage(language)}
        helperText="Defaults to the video's language when left empty"
        sx={{ minWidth: 160 }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 160,
          order: 3,
        }}
      >
        <input
          id="format"
          type="checkbox"
          checked={format}
          onChange={(e) => setFormat(e.target.checked)}
          sx={{ p: 0, mt: 0.5 }}
        />
        <label htmlFor="format" sx={{ mt: 0.25, fontSize: "0.85rem" }}>
          Format with LLM
        </label>
      </Box>
      <ActionButton type="submit" loading={loading} fullWidth={!onSubmit}>
        Transcribe
      </ActionButton>
    </>
  );

  // While the server action runs, show an animated step-by-step box.
  if (loading) {
    return (
      <Box sx={{ mb: 4, ...formLayout }}>
        <StepsBox steps={TRANSCRIBE_STEPS} activeIndex={stepRef.current} />
      </Box>
    );
  }

  if (onSubmit) {
    // Test/programmatic path: controlled form, no router required.
    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, ...formLayout }}>
        {displayFields}
      </Box>
    );
  }

  // Production path: POSTs to the index route action (progressive enhancement).
  return (
    <Box sx={{ mb: 4 }}>
      <Form method="post" style={{ ...formLayout }}>
        {displayFields}
      </Form>
    </Box>
  );
}