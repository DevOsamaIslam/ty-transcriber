import React from "react";
import { Box, Typography } from "@mui/material";

export type EmptyStateProps = {
  heading: string;
  message: string;
  /** Optional icon rendered in a soft brand-colored circle above the heading. */
  icon?: React.ReactNode;
};

/** Centered empty-state block with an optional icon, heading and message. */
export function EmptyState({ heading, message, icon }: EmptyStateProps) {
  return (
    <Box
      component="div"
      sx={{
        py: 6,
        px: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 56,
            height: 56,
            mb: 1.5,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(255, 184, 28, 0.16)",
            color: "warning.main",
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
        {heading}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 360 }}>
        {message}
      </Typography>
    </Box>
  );
}
