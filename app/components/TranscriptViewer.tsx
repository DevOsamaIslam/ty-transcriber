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
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        {transcript.title}
      </Typography>
      <Typography variant="body1" whiteSpace="pre-wrap" sx={{ mb: 3 }}>
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