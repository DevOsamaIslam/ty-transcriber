import React from "react";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

/** ISO 639-1 language options for transcript language selection. */
export const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "", label: "Auto-detect (video's default)" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

export interface LanguageSelectProps {
  /** Name attribute for form submission (posted to the route action). */
  name?: string;
  /** Currently selected ISO 639-1 code (empty string = auto-detect). */
  value?: string;
  /** Callback fired when the selection changes. */
  onChange?: (language: string) => void;
  /** Label text. */
  label?: string;
  /** Helper text shown below the select. */
  helperText?: string;
  /** Whether the field is in an error state. */
  error?: boolean;
  sx?: React.CSSProperties;
}

export function LanguageSelect({
  name,
  value = "",
  onChange,
  label = "Transcript language",
  helperText,
  error = false,
  sx,
}: LanguageSelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange?.(event.target.value as string);
  };

  return (
    <FormControl fullWidth error={error} sx={{ minWidth: 160, ...sx }}>
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        onChange={handleChange}
        label={label}
        error={error}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
