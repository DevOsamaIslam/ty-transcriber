import React, { useState } from "react"
import { Form } from "react-router"
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { HelpOutlineRounded } from "@mui/icons-material"
import { ActionButton } from "./ui/ActionButton"
import { InputField } from "./ui/InputField"
import { LanguageSelect } from "./ui/LanguageSelect"
import { StepsBox } from "./ui/StepsBox"
import { Surface } from "./ui/Surface"
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

// Amber accent bar on top of the form card — the primary CTA of the app.
const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderTop: 3,
  borderColor: "primary.main",
} as const

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

  const header = (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
        New transcription
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Paste a YouTube video or playlist URL — the transcript is saved to your
        history.
      </Typography>
    </Box>
  )

  const displayFields = (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <InputField
        name="url"
        label="YouTube URL"
        placeholder="https://youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={!!displayError}
        helperText={displayError}
        margin="none"
      />
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <LanguageSelect
          name="language"
          value={language}
          onChange={(language) => setLanguage(language)}
          helperText="Defaults to the video's language when left empty"
          sx={{ flex: "1 1 240px", minWidth: 240 }}
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
        <Tooltip title="Clean up the raw transcript with the LLM: merge sources into structured Markdown.">
          <IconButton
            size="small"
            aria-label="About the format option"
            sx={{ color: "text.secondary", ml: -1.5 }}
          >
            <HelpOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <ActionButton type="submit" loading={loading} fullWidth={!onSubmit}>
        Transcribe
      </ActionButton>
    </Stack>
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
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Surface sx={cardSx}>
          {header}
          {displayFields}
        </Surface>
        {stepper}
      </Box>
    )
  }

  // Production path: POSTs to the index route action (progressive enhancement).
  return (
    <Box sx={{ mb: 4 }}>
      <Surface sx={cardSx}>
        {header}
        <Form method="post">{displayFields}</Form>
      </Surface>
      {stepper}
    </Box>
  )
}

