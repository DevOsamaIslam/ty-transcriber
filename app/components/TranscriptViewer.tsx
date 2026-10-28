import {
  Divider,
  Grid,
  Link,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material"
import { Transcript } from "../modules/storage"
import { ActionButton } from "./ui/ActionButton"
import { Markdown } from "./ui/Markdown"
import { Surface } from "./ui/Surface"

export type TranscriptViewerProps = {
  transcript: Transcript
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const {
    id,
    title,
    originalTitle,
    transcript: body,
    sourceUrl,
    channel,
    playlistIndex,
    source,
    language,
    uploadDate,
    videoDate,
    createdAt,
  } = transcript

  return (
    <Surface sx={{ p: 3, mb: 2 }}>
      {/* dir="auto": Arabic titles/transcripts must render right-to-left
          without forcing every page to RTL. */}
      <Typography variant="h6" component="h3" sx={{ mb: 2 }} dir="auto">
        {title}
      </Typography>

      {/* Transcript metadata as MUI key/value list items.
          Two columns on medium+ screens, one column below. */}
      <Grid container sx={{ mb: 2, minWidth: 0 }} spacing={2}>
        {[
          {
            primary: "Source URL",
            secondary: (
              <Link
                component="a"
                href={sourceUrl}
                target="_blank"
                rel="noopener"
                sx={{
                  color: "primary",
                  wordBreak: "break-all",
                  textDecoration: "underline",
                }}
                dir="auto">
                {sourceUrl}
              </Link>
            ),
          },
          channel && {
            primary: "Channel",
            secondary: channel,
            slotProps: { secondary: { dir: "auto" } },
          },
          {
            primary: "Source",
            secondary:
              source === "whisper"
                ? "Whisper transcription"
                : "YouTube captions",
          },
          playlistIndex != null && {
            primary: "Playlist position",
            secondary: playlistIndex,
          },
          language && { primary: "Language", secondary: language },
          uploadDate && {
            primary: "Upload date",
            secondary: formatDate(uploadDate),
          },
          videoDate && {
            primary: "Video date",
            secondary: formatDate(videoDate),
          },
          originalTitle &&
            originalTitle !== title && {
              primary: "Original title",
              secondary: originalTitle,
              slotProps: { secondary: { dir: "auto" } },
            },
          { primary: "Saved", secondary: formatDate(createdAt) },
          {
            primary: "ID",
            secondary: id,
            slotProps: {
              secondary: {
                sx: { fontFamily: "monospace", fontSize: "0.85rem" },
              },
            },
          },
        ].map((row, i) => {
          if (!row || typeof row !== "object") return null
          return (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <ListItem sx={{ pb: 1 }}>
                <ListItemText
                  primary={row.primary}
                  secondary={row.secondary}
                  slotProps={row.slotProps}
                />
              </ListItem>
            </Grid>
          )
        })}
      </Grid>
      <Divider sx={{ mb: 2 }} />
      {/* The transcript body is Markdown, not raw text. */}
      <Markdown>{body}</Markdown>
    </Surface>
  )
}
