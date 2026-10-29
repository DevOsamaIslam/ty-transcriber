import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { listTranscripts } from "../modules/storage";
import { TranscriptList } from "../components/TranscriptList";
import { PageHeader } from "../components/ui/PageHeader";
import { Container } from "@mui/material";

export async function loader({ params }: LoaderFunctionArgs) {
  const channel = params.channel;

  if (!channel) {
    return redirect("/");
  }

  const transcripts = await listTranscripts({ channel });
  // v8: plain object return (no `json()` helper)
  return { transcripts, channel };
}

export default function TranscriptsChannelRoute() {
  const { transcripts, channel } = useLoaderData<typeof loader>();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <PageHeader
        backTo={{ to: "/", label: "All transcripts" }}
        overline="Channel"
        title={channel}
        subtitle={`${transcripts.length} transcript${transcripts.length !== 1 ? "s" : ""}`}
      />
      <TranscriptList transcripts={transcripts} />
    </Container>
  );
}
