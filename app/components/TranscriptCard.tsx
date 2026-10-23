import React from "react";
import { Card, CardContent, CardActionArea, Typography, Link, Box } from "@mui/material";
import { ActionButton } from "./ui/ActionButton";

export type TranscriptCardProps = {
  id: string;
  title: string;
  preview: string;
  sourceUrl: string;
  createdAt: string;
};

export function TranscriptCard({
  id,
  title,
  preview,
  sourceUrl,
  createdAt,
}: TranscriptCardProps) {
  const date = new Date(createdAt).toLocaleDateString();
  return (
    <Card sx={{ mb: 2, maxWidth: "100%" }}>
      <CardActionArea>
        <CardContent>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {preview}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
        </CardContent>
      </CardActionArea>
      <Box sx={{ px: 3, pb: 2 }}>
        <ActionButton
          size="small"
          variant="outline"
          component={Link}
          href={`/transcripts/${id}`}
        >
          View
        </ActionButton>
      </Box>
    </Card>
  );
}