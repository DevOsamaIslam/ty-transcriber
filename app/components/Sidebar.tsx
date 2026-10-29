import React from "react";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { HistoryRounded } from "@mui/icons-material";
import { Link, useLocation } from "react-router";
import type { Transcript } from "../modules/storage";
import { formatDate } from "../utils/format";

export interface SidebarProps {
  /** Transcripts shown in the history list, newest first. */
  transcripts: Transcript[];
  /** Called when a history item is chosen (used to close a mobile drawer). */
  onClose?: () => void;
}

function sourceLabel(source: Transcript["source"] | undefined): string {
  switch (source) {
    case "captions":
      return "Captions";
    case "whisper":
      return "Whisper";
    default:
      return "Unknown";
  }
}

/**
 * Sidebar holding the user's transcription history.
 *
 * Renders each saved transcript as a link to its transcript page, newest
 * first, with the date and source (captions / whisper) as a subtitle. The
 * item for the current route is highlighted. On desktop the shell draws the
 * dividing border; the panel itself is plain paper that scrolls internally.
 */
export function Sidebar({ transcripts, onClose }: SidebarProps) {
  const location = useLocation();

  const handleItemClick = () => {
    onClose?.();
  };

  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 2.5,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          History
        </Typography>
        {transcripts.length > 0 && (
          <Chip
            label={transcripts.length}
            size="small"
            sx={{
              height: 20,
              minWidth: 20,
              fontSize: "0.7rem",
              bgcolor: "rgba(255, 184, 28, 0.18)",
              color: "warning.main",
            }}
          />
        )}
      </Box>
      <Divider />
      {transcripts.length === 0 ? (
        <Box sx={{ py: 4, px: 2, textAlign: "center", color: "text.secondary" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              mx: "auto",
              mb: 1.5,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255, 184, 28, 0.16)",
              color: "warning.main",
            }}
          >
            <HistoryRounded />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            No transcripts yet
          </Typography>
          <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
            Transcribe a YouTube video to start building your history.
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
          {transcripts.map((t) => {
            const to = `/transcripts/${t.id}`;
            return (
              <ListItem key={t.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={to}
                  onClick={handleItemClick}
                  selected={location.pathname === to}
                  sx={{
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "rgba(255, 184, 28, 0.14)",
                      "&:hover": { bgcolor: "rgba(255, 184, 28, 0.22)" },
                    },
                  }}
                >
                  <ListItemText
                    primary={t.title}
                    slotProps={{
                      primary: {
                        variant: "body2",
                        fontWeight: 600,
                        noWrap: true,
                        sx: { color: "text.primary" },
                      },
                      secondary: { variant: "caption", noWrap: true },
                    }}
                    secondary={`${formatDate(t.createdAt)} · ${sourceLabel(t.source)}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}

