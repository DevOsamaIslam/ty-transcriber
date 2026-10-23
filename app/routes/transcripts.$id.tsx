import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { getTranscript } from "../modules/storage";
import { TranscriptViewer } from "../components/TranscriptViewer";
import { Container, Typography } from "@mui/material";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;

  if (!id) {
    return redirect("/");
  }

  const transcript = await getTranscript(id);

  if (!transcript) {
    return redirect("/");
  }

  // v8: plain object return (no `json()` helper)
  return { transcript };
}

export default function TranscriptRoute() {
  const { transcript } = useLoaderData<typeof loader>();

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Transcript
      </Typography>
      <TranscriptViewer transcript={transcript} />
    </Container>
  );
}