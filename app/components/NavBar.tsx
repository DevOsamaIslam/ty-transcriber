import React from "react";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import { Menu } from "@mui/icons-material";
import { Link } from "react-router";
import { Logo } from "./ui/Logo";

export interface NavBarProps {
  /** Opens the mobile history drawer. Hidden above the `md` breakpoint. */
  onMenuClick?: () => void;
}

/**
 * Fixed top app bar with the brand logo and the mobile menu toggle.
 *
 * Flat and translucent (frosted glass over the page content) with a hairline
 * bottom border instead of a shadow. The Toolbar is forced to a fixed 64px
 * height on every breakpoint so the shell's APP_BAR_HEIGHT offset is exact —
 * MUI's responsive default (56 → 64px) would leave the content overlapping.
 *
 * The hamburger is hidden above the `md` breakpoint, where the sticky
 * history sidebar is permanent, so `onMenuClick` only fires on mobile.
 */
export function NavBar({ onMenuClick }: NavBarProps) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px) saturate(160%)",
        WebkitBackdropFilter: "blur(10px) saturate(160%)",
        borderBottom: 1,
      }}
    >
      <Toolbar sx={{ minHeight: 64, height: 64 }}>
        <IconButton
          color="inherit"
          size="large"
          edge="start"
          aria-label="Open history menu"
          onClick={onMenuClick}
          sx={{ display: { xs: "flex", md: "none" }, mr: 2, color: "inherit" }}
        >
          <Menu />
        </IconButton>
        {/* `style` is used here because react-router's `Link` does not accept the `sx` prop. */}
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo sx={{ color: "inherit" }} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
}

