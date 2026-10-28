import React, { useState } from "react"
import { Form } from "react-router"
import { Box, Checkbox, FormControlLabel, Stack } from "@mui/material"
import { ActionButton } from "./ui/ActionButton"
import { InputField } from "./ui/InputField"
import { LanguageSelect } from "./ui/LanguageSelect"
import { StepsBox } from "./ui/StepsBox"
import type { JobProgress } from "../modules/job"

export type UrlFormProps = {
  /**
   * Test/programmatic submit handler. When omitted, the form uses
   * React Router's <Form method="post"> and POSTs `url`, `language` and
   * `format` to the route action.
   */
  onSubmit?: (data: { url: string; language: string; format: boolean }) => void
  /** Shows a spinner and disables the button while the action runs. */
  loading?: boolean
  /** Error message returned from the route action. */
  serverError?: string | null
  /** Real progress from the server (SSE). When set, shows the stepper below the form. */
  progress?: JobProgress | null
}

const formLayout = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "flex-start",
} as const

// Maps server job steps to stepper indices.
const STEP_LABELS = [
  "Fetching video metadata",
  "Getting captions / transcribing",
  "Formatting transcript",
  "Saving transcript",
]

function stepIndexFromProgress(step: JobProgress["step"]): number {
  switch (step) {
    case "metadata":
      return 0
    case "captions":
      return 1
    case "formatting":
      return 2
    case "saving":
      return 3
    case "done":
    case "error":
      return 3
  }
}

export function UrlForm({
  onSubmit,
  loading,
  serverError,
  progress,
}: UrlFormProps) {
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState("")
  const [format, setFormat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayError = error ?? serverError ?? null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!url.trim()) {
      setError("Please enter a YouTube URL")
      return
    }
    onSubmit?.({ url, language, format })
  }

  const displayFields = (
    <Box sx={{ width: "100%" }}>
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
      <Stack direction="row" spacing={2}>
        <LanguageSelect
          name="language"
          value={language}
          onChange={(language) => setLanguage(language)}
          helperText="Defaults to the video's language when left empty"
          sx={{ minWidth: 160 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="format"
              checked={format}
              onChange={(e) => setFormat(e.target.checked)}
              size="small"
            />
          }
          label="Format"
        />
      </Stack>
      <ActionButton type="submit" loading={loading} fullWidth={!onSubmit}>
        Transcribe
      </ActionButton>
    </Box>
  )

  // Show the stepper below the form, driven by real server progress (SSE).
  const stepper = progress ? (
    <StepsBox
      steps={STEP_LABELS}
      activeIndex={stepIndexFromProgress(progress.step)}
    />
  ) : null

  if (onSubmit) {
    // Test/programmatic path: controlled form, no router required.
    return (
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mb: 4, ...formLayout }}>
        {displayFields}
        {stepper}
      </Box>
    )
  }

  // Production path: POSTs to the index route action (progressive enhancement).
  return (
    <Box sx={{ mb: 4 }}>
      <Form method="post" style={{ ...formLayout }}>
        {displayFields}
      </Form>
      {stepper}
    </Box>
  )
}
