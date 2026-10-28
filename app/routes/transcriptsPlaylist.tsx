import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { listTranscripts } from "../modules/storage";
import { TranscriptList } from "../components/TranscriptList";
import { Container, Typography } from "@mui/material";

export async function loader({ params }: LoaderFunctionArgs) {
  const playlistId = params.playlistId;

  if (!playlistId) {
    return redirect("/");
  }

  const transcripts = await listTranscripts({ playlistId });
  // v8: plain object return (no `json()` helper)
  return { transcripts, playlistId };
}

export default function TranscriptsPlaylistRoute() {
  const { transcripts, playlistId } = useLoaderData<typeof loader>();

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Playlist
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {playlistId} · {transcripts.length} transcript{transcripts.length !== 1 ? "s" : ""}
      </Typography>
      <TranscriptList transcripts={transcripts} />
    </Container>
  );
}
