import React from "react";
import { Box, Typography } from "@mui/material";

export interface LogoProps {
  sx?: React.CSSProperties;
}

/**
 * Brand logo for ty-transcriber.
 *
 * Uses the real `public/logo.png` asset in place of the inline SVG
 * placeholder. The mark is rendered at the same 32x32 size as the former
 * SVG, and the wordmark stays in `currentColor` so it adapts to the app bar.
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
      <Box sx={{ width: 32, height: 32, flexShrink: 0 }}>
        <img
          data-testid="logo-mark"
          src="/logo.png"
          alt="ty-transcriber"
          width={32}
          height={32}
        />
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
