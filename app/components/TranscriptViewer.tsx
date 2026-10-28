import React from "react"
import {
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material"
import { ActionButton } from "./ui/ActionButton"
import { Markdown } from "./ui/Markdown"
import { Surface } from "./ui/Surface"
import { Transcript } from "../modules/storage"

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

      {/* Transcript metadata above the body, shown as MUI key/value list items. */}
      <List sx={{ mb: 2, minWidth: 0 }}>
        <ListItem>
          <ListItemText
            primary="Source URL"
            secondary={
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
            }
          />
        </ListItem>

        {channel && (
          <ListItem>
            <ListItemText
              primary="Channel"
              secondary={channel}
              secondaryTypographyProps={{ dir: "auto" }}
            />
          </ListItem>
        )}
        <ListItem>
          <ListItemText
            primary="Source"
            secondary={
              source === "whisper"
                ? "Whisper transcription"
                : "YouTube captions"
            }
          />
        </ListItem>
        {playlistIndex != null && (
          <ListItem>
            <ListItemText
              primary="Playlist position"
              secondary={playlistIndex}
            />
          </ListItem>
        )}
        {language && (
          <ListItem>
            <ListItemText primary="Language" secondary={language} />
          </ListItem>
        )}
        {uploadDate && (
          <ListItem>
            <ListItemText
              primary="Upload date"
              secondary={formatDate(uploadDate)}
            />
          </ListItem>
        )}
        {videoDate && (
          <ListItem>
            <ListItemText
              primary="Video date"
              secondary={formatDate(videoDate)}
            />
          </ListItem>
        )}
        {originalTitle && originalTitle !== title && (
          <ListItem>
            <ListItemText
              primary="Original title"
              secondary={originalTitle}
              secondaryTypographyProps={{ dir: "auto" }}
            />
          </ListItem>
        )}
        <ListItem>
          <ListItemText primary="Saved" secondary={formatDate(createdAt)} />
        </ListItem>
      </List>
      <Divider />
      {/* The transcript body is Markdown, not raw text. */}
      <Markdown>{body}</Markdown>

      <ActionButton
        size="small"
        variant="outline"
        onClick={() => void navigator.clipboard.writeText(body)}>
        Copy to clipboard
      </ActionButton>
    </Surface>
  )
}
