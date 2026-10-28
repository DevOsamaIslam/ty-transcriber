import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { getTranscriptForUrl, getTranscriptsForPlaylist } from "../modules/transcript";
import { listTranscripts, saveTranscript } from "../modules/storage";
import { parseYouTubeUrl, isPlaylist, extractId } from "../modules/url";
import { formatTranscript } from "../modules/openrouter";
import type { TranscriptSources } from "../modules/openrouter";
import { TranscriptList } from "../components/TranscriptList";
import { UrlForm } from "../components/UrlForm";
import { Box, Container, Typography } from "@mui/material";

export async function loader(_args: LoaderFunctionArgs) {
  const transcripts = await listTranscripts();
  // v8: loaders return plain objects — auto-serialized (no `json()` helper)
  return { transcripts };
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
    if (isPlaylist(parsed)) {
      // Persist every video of the playlist under channel/playlist, then
      // surface the playlist page. (The format option applies to single
      // video transcription; playlists are saved raw to avoid one LLM call
      // per video.)
      await getTranscriptsForPlaylist(url, { language: languageStr });
      return redirect(`/transcripts/playlist/${extractId(parsed)}`);
    }
    const result = await getTranscriptForUrl(url, { language: languageStr });
    let transcript = result.transcript;

    if (shouldFormat) {
      // Feed the obtained transcript through the LLM formatter, then
      // persist the formatted text (falling back to raw on failure).
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
        });
      } catch (err) {
        console.warn(
          "Formatting failed, keeping raw transcript:",
          err instanceof Error ? err.message : String(err)
        );
      }
      await saveTranscript({ ...result, transcript });
    }

    return redirect(`/transcripts/${result.id}`);
  } catch (err) {
    console.error("Transcription failed:", err);
    return data({ error: "Could not generate transcript" }, { status: 422 });
  }
}

export default function Index() {
  const { transcripts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as
    | { error?: string }
    | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: "center" }}>
        YouTube Transcriber
      </Typography>
      <UrlForm loading={submitting} serverError={actionData?.error ?? null} />
      <Box sx={{ mt: 6 }}>
        <TranscriptList transcripts={transcripts} />
      </Box>
    </Container>
  );
}