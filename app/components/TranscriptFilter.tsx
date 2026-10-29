import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
} from "@mui/material";
import { Clear, Search } from "@mui/icons-material";
import { LANGUAGES } from "./ui/LanguageSelect";

type FilterParams = {
  /** Free-text match against title, channel, original title and source URL. */
  q?: string;
  /** Transcript source: "captions" | "whisper". */
  source?: string;
  /** Transcript language (ISO 639-1). */
  language?: string;
  /** YouTube channel. */
  channel?: string;
};

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Any source" },
  { value: "captions", label: "YouTube captions" },
  { value: "whisper", label: "Whisper" },
];

// How long to wait after the last keystroke before pushing the search query
// to the URL and re-running the route loader.
const DEBOUNCE_MS = 300;

/**
 * Search and filter bar for the stored transcripts on the main page.
 *
 * Filter values live in the URL search params (`q`, `source`, `language`,
 * `channel`), so the current filter is shareable and changing any field
 * re-runs the route loader to fetch the matching transcripts from the
 * database.
 */
export function TranscriptFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const source = searchParams.get("source") ?? "";
  const language = searchParams.get("language") ?? "";
  const channel = searchParams.get("channel") ?? "";

  const hasFilters = Boolean(q || source || language || channel);

  // Local, immediately-updated value so typing stays responsive while the
  // URL update is debounced.
  const [localQuery, setLocalQuery] = useState(q);
  // Id of the pending debounce timer, if any.
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Re-sync the local value when the URL params change externally
  // (e.g. back/forward navigation or clearing filters from elsewhere).
  useEffect(() => {
    setLocalQuery(q);
  }, [q]);

  // Cancel any pending debounce when the component unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const setFilter = (key: keyof FilterParams, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  // Search is debounced: every keystroke updates the local input and resets
  // the timer, but the URL is only pushed once typing pauses for DEBOUNCE_MS.
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setFilter("q", value);
    }, DEBOUNCE_MS);
    setDebounceTimer(timer);
  };

  const clearFilters = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setSearchParams(new URLSearchParams());
    setLocalQuery("");
    setDebounceTimer(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: 1,
        borderColor: "divider",
        borderRadius: "12px",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="Search"
          placeholder="Title, channel or source URL"
          value={localQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ flex: 2, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ color: "text.secondary", mr: 1 }} />,
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Source</InputLabel>
          <Select
            label="Source"
            value={source}
            onChange={(event) => setFilter("source", event.target.value as string)}
          >
            {SOURCE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Language</InputLabel>
          <Select
            label="Language"
            value={language}
            onChange={(event) => setFilter("language", event.target.value as string)}
          >
            <MenuItem value="">Any</MenuItem>
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Channel"
          placeholder="Channel name"
          value={channel}
          onChange={(event) => setFilter("channel", event.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 180 }}
        />
        {hasFilters && (
          <Button
            startIcon={<Clear />}
            size="small"
            onClick={clearFilters}
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            Clear filters
          </Button>
        )}
      </Box>
    </Paper>
  );
}
