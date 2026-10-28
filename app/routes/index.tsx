import React, { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useNavigate,
} from "react-router";
import { getTranscriptForUrl, getTranscriptsForPlaylist } from "../modules/transcript";
import { listTranscripts, saveTranscript } from "../modules/storage";
import { parseYouTubeUrl, isPlaylist, extractId } from "../modules/url";
import { getVideoMetadata } from "../modules/youtube";
import { formatTranscript } from "../modules/openrouter";
import type { TranscriptSources } from "../modules/openrouter";
import { createJob, updateJob, type JobProgress } from "../modules/job";
import { TranscriptList } from "../components/TranscriptList";
import { TranscriptFilter } from "../components/TranscriptFilter";
import { UrlForm } from "../components/UrlForm";
import type { TranscriptListFilter } from "../modules/storage";
import { Box, Container, Typography } from "@mui/material";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const filter: TranscriptListFilter = {};
  const query = url.searchParams.get("q");
  if (query) filter.query = query;
  const source = url.searchParams.get("source");
  if (source === "captions" || source === "whisper") filter.source = source;
  const language = url.searchParams.get("language");
  if (language) filter.language = language;
  const channel = url.searchParams.get("channel");
  if (channel) filter.channel = channel;

  const transcripts = await listTranscripts(filter);
  // v8: loaders return plain objects — auto-serialized (no `json()` helper)
  return { transcripts, filter };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const url = formData.get("url");
  const language = formData.get("language");
  const format = formData.get("format");
  const languageStr = typeof language === "string" ? language : undefined;
  const shouldFormat = format === "on";

  if (typeof url !== "string" || !url.trim()) {
    return data({ error: "URL is required" }, { status: 400 });
  }

  try {
    const parsed = parseYouTubeUrl(url);

    // Playlists are still handled synchronously (no format option).
    if (isPlaylist(parsed)) {
      await getTranscriptsForPlaylist(url, { language: languageStr });
      return redirect(`/transcripts/playlist/${extractId(parsed)}`);
    }

    // Single video: start a background job and return the job id so the
    // client can stream progress via SSE.
    const jobId = createJob();

    (async () => {
      try {
        // Step 1: metadata.
        updateJob(jobId, { step: "metadata", message: "Fetching video metadata…" });
        const metadata = await getVideoMetadata(url);

        // Step 2: captions / transcription.
        updateJob(jobId, { step: "captions", message: "Getting captions / transcribing…" });
        const result = await getTranscriptForUrl(url, { language: languageStr });

        let transcript = result.transcript;

        // Step 3: formatting (optional).
        if (shouldFormat) {
          updateJob(jobId, { step: "formatting", message: "Formatting transcript…" });
          try {
            const sources: TranscriptSources = {};
            if (result.source === "whisper") {
              sources.whisper = result.transcript;
            } else {
              sources.captions = result.transcript;
            }
            transcript = await formatTranscript(sources, {
              title: result.title,
              channel: result.channel ?? "",
              url: result.sourceUrl,
            }, languageStr);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            updateJob(jobId, {
              step: "error",
              message: `Transcript saved, but LLM formatting failed: ${message}`,
            });
            return;
          }
        }

        // Step 4: saving.
        updateJob(jobId, { step: "saving", message: "Saving transcript…" });
        await saveTranscript({ ...result, transcript });

        updateJob(jobId, { step: "done", message: "Done!", transcriptId: result.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        updateJob(jobId, { step: "error", message: `Transcription failed: ${message}` });
      }
    })();

    return data({ jobId });
  } catch (err) {
    console.error("Transcription failed:", err);
    return data({ error: "Could not generate transcript" }, { status: 422 });
  }
}

export default function Index() {
  const { transcripts, filter } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as
    | { jobId?: string; error?: string }
    | undefined;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submitting = navigation.state === "submitting";

  const [progress, setProgress] = useState<JobProgress | null>(null);

  // Start SSE when a new job id appears in the action data, streaming
  // real progress from the server as each step completes.
  useEffect(() => {
    const jobId = actionData?.jobId;
    if (!jobId) {
      setProgress(null);
      return;
    }

    let cancelled = false;

    async function connect() {
      try {
        const response = await fetch(`/api/job/${jobId}`);
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const match = line.match(/^data: (.*)$/s);
            if (!match) continue;
            try {
              const event = JSON.parse(match[1]) as JobProgress;
              if (cancelled) break;
              setProgress(event);
              if (event.step === "done") {
                if (event.transcriptId) {
                  navigate(`/transcripts/${event.transcriptId}`);
                }
                return;
              }
              if (event.step === "error") {
                return;
              }
            } catch {
              // Ignore unparseable lines.
            }
          }
        }
      } catch {
        // SSE connection failed silently; the form-level error covers this.
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [actionData?.jobId, navigate]);

  const serverError = actionData?.error ?? null;

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: "center" }}>
        YouTube Transcriber
      </Typography>
      <UrlForm
        loading={submitting}
        serverError={serverError}
        progress={progress}
      />
      <TranscriptFilter />
      <Box sx={{ mt: 6 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {transcripts.length} transcript{transcripts.length !== 1 ? "s" : ""} found{" "}
          {filter.query && `matching "${filter.query}"`}
        </Typography>
        <TranscriptList transcripts={transcripts} />
      </Box>
    </Container>
  );
}