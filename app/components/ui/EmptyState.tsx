import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { DeleteForever } from "@mui/icons-material";

export type EmptyStateProps = {
  heading: string;
  message: string;
};

export function EmptyState({ heading, message }: EmptyStateProps) {
  return (
    <Box component="div" py={4} sx={{ textAlign: "center", color: "text.secondary" }}>
      <Typography variant="h6">{heading}</Typography>
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}