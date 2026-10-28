import React from "react";
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import type { Transcript } from "../modules/storage";

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
 * first, with the source (captions / whisper) and date as a subtitle.
 */
export function Sidebar({ transcripts, onClose }: SidebarProps) {
  const handleItemClick = () => {
    onClose?.();
  };

  return (
    <Box component="nav" sx={{ borderRight: 1 }}>
      <Toolbar sx={{ pb: 0 }}>
        <Typography variant="h6" fontWeight={700}>
          History
        </Typography>
      </Toolbar>
      <Divider />
      {transcripts.length === 0 ? (
        <Box py={2} textAlign="center" sx={{ color: "text.secondary" }}>
          <Typography variant="body2">No transcripts yet</Typography>
          <Typography variant="caption" sx={{ mt: 1 }}>
            Transcribe a YouTube video to start building your history.
          </Typography>
        </Box>
      ) : (
        <List dense>
          {transcripts.map((t) => {
            const date = new Date(t.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            return (
              <ListItem key={t.id} disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/transcripts/${t.id}`}
                  onClick={handleItemClick}
                  sx={{ py: 1.5, px: 1 }}
                >
                  <ListItemText
                    primary={t.title}
                    primaryTypographyProps={{
                      variant: "body1",
                      fontWeight: 600,
                      noWrap: true,
                    }}
                    secondary={`${date} · ${sourceLabel(t.source)}`}
                    secondaryTypographyProps={{ variant: "caption" }}
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
