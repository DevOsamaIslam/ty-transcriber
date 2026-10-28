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
                    bgcolor: isComplete ? "success.main" : "grey.300",
                  }}
                />
              )}
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: isComplete
                    ? "success.main"
                    : isActive
                    ? "primary.main"
                    : "grey.300",
                  color: isComplete || isActive ? "common.white" : "grey.600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  flexShrink: 0,
                  border: isActive ? "2px solid currentColor" : undefined,
                  boxShadow: isActive
                    ? "0 0 0 4px rgba(25, 118, 210, 0.25)"
                    : undefined,
                  animation: isActive ? "pulse 1.5s infinite" : undefined,
                }}
              >
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
              {isActive && (
                <CircularProgress size={16} sx={{ color: "primary.main", ml: 0.5 }} />
              )}
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
