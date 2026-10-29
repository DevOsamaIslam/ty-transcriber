import { useEffect, useState } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
} from "react-router"
import { getTranscript, saveTranscript } from "../modules/storage"
import { formatTranscript } from "../modules/openrouter"
import type { TranscriptSources } from "../modules/openrouter"
import { createJob, updateJob, type JobProgress } from "../modules/job"
import { TranscriptViewer } from "../components/TranscriptViewer"
import { StepsBox } from "../components/ui/StepsBox"
import { ActionButton } from "../components/ui/ActionButton"
import { Alert, AlertTitle, Container } from "@mui/material"
import { AutoAwesomeRounded } from "@mui/icons-material"
import { PageHeader } from "../components/ui/PageHeader"

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id

  if (!id) {
    return redirect("/")
  }

  const transcript = await getTranscript(id)

  if (!transcript) {
    return redirect("/")
  }

  // v8: plain object return (no `json()` helper)
  return { transcript }
}

/** Re-format the stored transcript in a background job and re-save it. */
export async function action({ params }: ActionFunctionArgs) {
  const id = params.id

  if (!id) {
    return redirect("/")
  }

  const transcript = await getTranscript(id)

  if (!transcript) {
    return redirect("/")
  }

  const jobId = createJob()

  ;(async () => {
    try {
      updateJob(jobId, {
        step: "formatting",
        message: "Formatting transcript…",
      })

      const sources: TranscriptSources = {}
      const source = transcript.source ?? "captions"
      if (source === "whisper") {
        sources.whisper = transcript.transcript
      } else {
        sources.captions = transcript.transcript
      }

      const formatted = await formatTranscript(
        sources,
        {
          title: transcript.title,
          channel: transcript.channel ?? "",
          url: transcript.sourceUrl,
        },
        transcript.language,
      )

      updateJob(jobId, { step: "saving", message: "Saving transcript…" })
      await saveTranscript({ ...transcript, transcript: formatted })

      updateJob(jobId, {
        step: "done",
        message: "Done!",
        transcriptId: transcript.id,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      updateJob(jobId, {
        step: "error",
        message: `Re-formatting failed: ${message}`,
      })
    }
  })()

  return data({ jobId })
}

const FORMAT_STEP_LABELS = ["Formatting transcript", "Saving transcript"]

function stepIndexFromProgress(step: JobProgress["step"]): number {
  switch (step) {
    case "formatting":
      return 0
    case "saving":
    case "done":
    case "error":
      return 1
  }

  return 1
}

export default function TranscriptRoute() {
  const { transcript } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>() as
    | { jobId?: string; error?: string }
    | undefined
  const navigate = useNavigate()
  const [progress, setProgress] = useState<JobProgress | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Stream the re-format job's progress from the server via SSE.
  useEffect(() => {
    const jobId = actionData?.jobId
    if (!jobId) {
      setProgress(null)
      return
    }

    let cancelled = false

    async function connect() {
      try {
        const response = await fetch(`/api/job/${jobId}`)
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ""

        while (!cancelled) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const match = line.match(/^data: (.*)$/s)
            if (!match) continue
            try {
              const event = JSON.parse(match[1]) as JobProgress
              if (cancelled) break
              setProgress(event)
              if (event.step === "done") {
                if (event.transcriptId) {
                  navigate(`/transcripts/${event.transcriptId}`)
                }
                return
              }
              if (event.step === "error") {
                setServerError(event.message)
                return
              }
            } catch {
              // Ignore unparseable lines.
            }
          }
        }
      } catch {
        // SSE connection failed silently; a job failure is surfaced via its error step.
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [actionData?.jobId, navigate])

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <PageHeader
        backTo={{ to: "/", label: "All transcripts" }}
        title="Transcript"
        actions={
          <Form method="post" style={{ display: "inline-flex" }}>
            <ActionButton
              type="submit"
              size="small"
              variant="outline"
              startIcon={<AutoAwesomeRounded />}
              disabled={progress != null}>
              Re-format
            </ActionButton>
          </Form>
        }
      />
      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Re-formatting failed</AlertTitle>
          {serverError}
        </Alert>
      )}
      {progress && (
        <StepsBox
          steps={FORMAT_STEP_LABELS}
          activeIndex={stepIndexFromProgress(progress.step)}
          heading="Re-formatting transcript…"
        />
      )}
      <TranscriptViewer transcript={transcript} />
    </Container>
  )
}
