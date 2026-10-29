import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import { Link } from "react-router";

export interface PageHeaderProps {
  /** Page title (rendered as an h1). */
  title: string;
  /** Small uppercase label above the title, in the brand accent color. */
  overline?: string;
  /** Supporting line below the title. */
  subtitle?: React.ReactNode;
  /** Optional back link rendered above the title. */
  backTo?: { to: string; label: string };
  /** Right-aligned action area (buttons, forms). */
  actions?: React.ReactNode;
}

/**
 * Consistent page header: optional back link, overline, title, subtitle and
 * a right-aligned action area. Used at the top of every page route so all
 * pages share the same spacing and hierarchy.
 */
export function PageHeader({
  title,
  overline,
  subtitle,
  backTo,
  actions,
}: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {backTo && (
        <Link to={backTo.to} style={{ textDecoration: "none" }}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "color .15s ease",
              "&:hover": { color: "text.primary" },
            }}
          >
            <ArrowBackRounded sx={{ fontSize: 18 }} />
            {backTo.label}
          </Box>
        </Link>
      )}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mt: backTo ? 1 : 0, flexWrap: "wrap", rowGap: 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          {overline && (
            <Typography
              variant="overline"
              component="div"
              sx={{
                color: "warning.main",
                fontWeight: 700,
                letterSpacing: "0.1em",
                lineHeight: 1.4,
              }}
            >
              {overline}
            </Typography>
          )}
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 0.5 }}
              dir="auto"
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
