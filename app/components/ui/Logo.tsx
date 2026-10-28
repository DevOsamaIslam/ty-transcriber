import React from "react";
import { Box, Typography } from "@mui/material";

export interface LogoProps {
  sx?: React.CSSProperties;
}

/**
 * Placeholder logo for ty-transcriber.
 *
 * An inline SVG mark (a rounded capture card with sound waves) plus the
 * product name, so the app ships with a brand mark without requiring an
 * external image asset. Replace the SVG with a real logo asset when ready.
 * Uses `currentColor` so the mark adapts to dark/light toolbars.
 */
export function Logo({ sx }: LogoProps) {
  return (
    <Box
      component="span"
      data-testid="logo"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <svg
          data-testid="logo-mark"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
        <rect x="2" y="2" width="28" height="28" rx="6" />
        <path d="M8 16 Q16 12 24 16" />
        <path d="M8 21 Q16 16 24 21" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </Box>
      <Typography
        variant="h6"
        fontWeight={700}
        noWrap
        color="inherit"
        sx={{ fontSize: "1.15rem", letterSpacing: "-0.01em" }}
      >
        ty-transcriber
      </Typography>
    </Box>
  );
}
