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
 * The hamburger is hidden above the `md` breakpoint, where the sticky
 * history sidebar is permanent, so `onMenuClick` only fires on mobile.
 */
export function NavBar({ onMenuClick }: NavBarProps) {
  return (
    <AppBar position="fixed" color="primary">
      <Toolbar>
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
        <Link to="/" style={{ textDecoration: "none" }}>
          <Logo sx={{ color: "inherit" }} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
}
