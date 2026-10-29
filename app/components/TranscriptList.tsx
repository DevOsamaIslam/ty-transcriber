import React from "react";
import { Grid } from "@mui/material";
import { SmartDisplayRounded } from "@mui/icons-material";
import { EmptyState } from "./ui/EmptyState";
import { TranscriptCard } from "./TranscriptCard";

export type TranscriptListProps = {
  transcripts: Array<{
    id: string;
    title: string;
    transcript: string;
    sourceUrl: string;
    createdAt: string;
    source?: "captions" | "whisper";
    channel?: string;
  }>;
};

export function TranscriptList({ transcripts }: TranscriptListProps) {
  if (!transcripts || transcripts.length === 0) {
    return (
      <EmptyState
        heading="No transcripts yet"
        message="Add a YouTube URL to get started."
        icon={<SmartDisplayRounded sx={{ fontSize: 28 }} />}
      />
    );
  }

  return (
    <Grid container spacing={2}>
      {transcripts.map((t) => (
        <Grid xs={12} sm={6} md={4} key={t.id}>
          <TranscriptCard {...t} />
        </Grid>
      ))}
    </Grid>
  );
}
