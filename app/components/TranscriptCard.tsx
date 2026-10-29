import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowForwardRounded,
  ClosedCaptionRounded,
  GraphicEqRounded,
} from "@mui/icons-material";
// react-router's Link gives the whole card client-side navigation.
import { Link } from "react-router";
import { ActionButton } from "./ui/ActionButton";
import { excerpt, formatDate } from "../utils/format";

export type TranscriptCardProps = {
  id: string;
  title: string;
  /** Short preview text. Derived from `transcript` when omitted. */
  preview?: string;
  /** Full transcript body, used to derive the preview when `preview` is missing. */
  transcript?: string;
  sourceUrl: string;
  createdAt: string;
  /** Where the transcript came from — surfaces the "download/transcription skipped" hint. */
  source?: "captions" | "whisper";
  channel?: string;
};

const SOURCE_META = {
  captions: {
    label: "Captions",
    icon: <ClosedCaptionRounded sx={{ fontSize: 16 }} />,
    tooltip: "Downloaded from YouTube captions — transcription skipped",
  },
  whisper: {
    label: "Whisper",
    icon: <GraphicEqRounded sx={{ fontSize: 16 }} />,
    tooltip: "Transcribed from audio with Whisper",
  },
} as const;

/**
 * Card for one saved transcript in the results grid.
 *
 * The whole card is a link (client-side navigation via react-router's
 * `href` support), it lifts on hover, and shows the source as a chip with
 * an explanatory tooltip instead of a plain text line.
 */
export function TranscriptCard({
  id,
  title,
  preview,
  transcript,
  sourceUrl,
  createdAt,
  source,
  channel,
}: TranscriptCardProps) {
  const body = preview ?? excerpt(transcript ?? "");
  const meta = source ? SOURCE_META[source] : null;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: 1,
        borderColor: "divider",
        transition: "box-shadow .2s ease, transform .2s ease, border-color .2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
          borderColor: "rgba(255, 107, 26, 0.45)",
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/transcripts/${id}`}
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: 700,
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            dir="auto"
          >
            {title}
          </Typography>
          {channel && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
              dir="auto"
            >
              {channel}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1.5,
            }}
            dir="auto"
          >
            {body}
          </Typography>
          {meta && (
            <Tooltip title={meta.tooltip}>
              <Chip
                size="small"
                icon={meta.icon}
                label={meta.label}
                sx={{
                  bgcolor: "rgba(255, 184, 28, 0.18)",
                  color: "warning.main",
                  "& .MuiChip-icon": { color: "warning.main" },
                }}
              />
            </Tooltip>
          )}
        </CardContent>
      </CardActionArea>
      <Box
        sx={{
          px: 2.5,
          pb: 2,
          pt: 0.5,
          mt: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatDate(createdAt)}
        </Typography>
        <ActionButton
          size="small"
          variant="text"
          component={Link}
          to={`/transcripts/${id}`}
          endIcon={<ArrowForwardRounded />}
        >
          View
        </ActionButton>
      </Box>
    </Card>
  );
}
