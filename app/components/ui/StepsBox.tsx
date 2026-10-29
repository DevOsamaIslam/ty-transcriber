import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Surface } from "./Surface";

export interface StepsBoxProps {
  /** Labels for each step, in order. */
  steps: string[];
  /** Index of the currently active step. */
  activeIndex: number;
  /** Heading shown above the steps. */
  heading?: string;
}

/** Renders an animated step-by-step progress box used while transcribing. */
export function StepsBox({ steps, activeIndex, heading = "Transcribing…" }: StepsBoxProps) {
  const lastIndex = steps.length - 1;

  return (
    <Surface sx={{ p: 3, mb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {heading}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {steps.map((label, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                position: "relative",
                pl: 1,
              }}
            >
              {/* Connector line from previous step to this one. */}
              {index > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 6,
                    top: 10,
                    bottom: 10,
                    width: 2,
                    bgcolor: isComplete ? "primary.main" : "divider",
                  }}
                />
              )}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: isComplete
                    ? "primary.main"
                    : isActive
                    ? "background.paper"
                    : "divider",
                  color: isComplete
                    ? "#202532"
                    : isActive
                    ? "text.primary"
                    : "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: "bold",
                  flexShrink: 0,
                  border: isActive ? "2px solid" : undefined,
                  borderColor: isActive ? "primary.main" : undefined,
                  // Defined here so the pulse animation actually exists —
                  // the previous code referenced an undefined keyframe.
                  "@keyframes pulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(255, 107, 26, 0.35)" },
                    "70%": { boxShadow: "0 0 0 8px rgba(255, 107, 26, 0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(255, 107, 26, 0)" },
                  },
                  animation: isActive ? "pulse 1.8s ease-out infinite" : undefined,
                  position: "relative",
                }}
              >
                {isActive && (
                  <CircularProgress
                    size={20}
                    strokeWidth={3}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      color: "primary.main",
                    }}
                    data-testid="step-spinner"
                  />
                )}
                {isComplete ? "✓" : index + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: isComplete ? "text.secondary" : "text.primary",
                  fontWeight: isActive ? "bold" : undefined,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {label}
              </Typography>
              {index < lastIndex && (
                <Box sx={{ flexGrow: 1 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Surface>
  );
}
