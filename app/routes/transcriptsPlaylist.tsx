import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { listTranscripts } from "../modules/storage";
import { TranscriptList } from "../components/TranscriptList";
import { PageHeader } from "../components/ui/PageHeader";
import { Container } from "@mui/material";

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
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <PageHeader
        backTo={{ to: "/", label: "All transcripts" }}
        overline="Playlist"
        title="Playlist"
        subtitle={`${playlistId} · ${transcripts.length} transcript${transcripts.length !== 1 ? "s" : ""}`}
      />
      <TranscriptList transcripts={transcripts} />
    </Container>
  );
}
