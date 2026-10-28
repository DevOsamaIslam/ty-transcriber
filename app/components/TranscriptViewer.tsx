import React from "react";
import { Typography, Box } from "@mui/material";
import { ActionButton } from "./ui/ActionButton";
import { Surface } from "./ui/Surface";

export type TranscriptViewerProps = {
  transcript: {
    id: string;
    title: string;
    transcript: string;
    sourceUrl: string;
  };
};

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  return (
    <Surface sx={{ p: 3, mb: 2 }}>
      {/* dir="auto": Arabic titles/transcripts must render right-to-left
          without forcing every page to RTL. */}
      <Typography variant="h6" component="h3" sx={{ mb: 2 }} dir="auto">
        {transcript.title}
      </Typography>
      <Typography variant="body1" whiteSpace="pre-wrap" sx={{ mb: 3 }} dir="auto">
        {transcript.transcript}
      </Typography>
      <ActionButton
        size="small"
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(transcript.transcript);
        }}
      >
        Copy to clipboard
      </ActionButton>
    </Surface>
  );
}