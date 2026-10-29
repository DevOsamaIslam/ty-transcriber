import {
  Box,
  Chip,
  Divider,
  Grid,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { ClosedCaptionRounded, GraphicEqRounded } from "@mui/icons-material"
import { Transcript } from "../modules/storage"
import { ActionButton } from "./ui/ActionButton"
import { Markdown } from "./ui/Markdown"
import { Surface } from "./ui/Surface"
import { formatDate } from "../utils/format"

export type TranscriptViewerProps = {
  transcript: Transcript
}

/**
 * Document-style viewer for a saved transcript.
 *
 * A header block (title, channel + source chips, saved date) sits above a
 * compact metadata grid and the Markdown body. Channel and source are shown
 * once — as header chips — instead of repeating them in the metadata grid.
 */
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

  const isWhisper = source === "whisper"

  const rows = [
    {
      primary: "Source URL",
      secondary: (
        <Link
          component="a"
          href={sourceUrl}
          target="_blank"
          rel="noopener"
          sx={{
            color: "warning.main",
            fontWeight: 500,
            wordBreak: "break-all",
            textDecoration: "underline",
          }}
          dir="auto">
          {sourceUrl}
        </Link>
      ),
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
        dir: "auto" as const,
      },
    { primary: "ID", secondary: id, mono: true },
  ]

  return (
    <Surface sx={{ overflow: "hidden" }}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, pb: 2.5, borderBottom: 1, borderColor: "divider" }}>
        {/* dir="auto": Arabic titles/transcripts must render right-to-left
            without forcing every page to RTL. */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ fontWeight: 700, mb: 1.5, overflowWrap: "anywhere" }}
          dir="auto"
        >
          {title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={{ flexWrap: "wrap" }}>
          {channel && (
            <Box component="span" dir="auto">
              <Chip
                size="small"
                label={channel}
                sx={{ bgcolor: "rgba(32, 37, 50, 0.06)", color: "text.primary" }}
              />
            </Box>
          )}
          <Tooltip
            title={
              isWhisper
                ? "Transcribed from audio with Whisper"
                : "Downloaded from YouTube captions — transcription skipped"
            }
          >
            <Chip
              size="small"
              icon={isWhisper ? <GraphicEqRounded /> : <ClosedCaptionRounded />}
              label={isWhisper ? "Whisper transcription" : "YouTube captions"}
              sx={{
                bgcolor: "rgba(255, 184, 28, 0.18)",
                color: "warning.main",
                "& .MuiChip-icon": { color: "warning.main" },
              }}
            />
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Saved {formatDate(createdAt)}
          </Typography>
          <ActionButton
            size="small"
            variant="outline"
            onClick={() => void navigator.clipboard.writeText(body)}>
            Copy to clipboard
          </ActionButton>
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Transcript metadata as a compact label/value grid.
            Two columns on medium+ screens, one column below. */}
        <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3, minWidth: 0 }}>
          {rows.map((row, i) => {
            if (!row || typeof row !== "object") return null
            return (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      minWidth: 104,
                      flexShrink: 0,
                    }}
                  >
                    {row.primary}
                  </Typography>
                  <Box
                    sx={{
                      minWidth: 0,
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      ...(row.mono
                        ? {
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                            fontSize: "0.8rem",
                            wordBreak: "break-all",
                          }
                        : {}),
                    }}
                    dir={row.dir}
                  >
                    {row.secondary}
                  </Box>
                </Box>
              </Grid>
            )
          })}
        </Grid>
        <Divider sx={{ mb: 3 }} />
        {/* The transcript body is Markdown, not raw text. */}
        <Markdown>{body}</Markdown>
      </Box>
    </Surface>
  )
}

