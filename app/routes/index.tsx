import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { getTranscriptForUrl } from "../modules/transcript";
import { listTranscripts } from "../modules/storage";
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

  if (typeof url !== "string" || !url.trim()) {
    return data({ error: "URL is required" }, { status: 400 });
  }

  try {
    const transcript = await getTranscriptForUrl(url);
    return redirect(`/transcripts/${transcript.id}`);
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