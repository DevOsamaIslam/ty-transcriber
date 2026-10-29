import { useState } from "react";
import {
  Box,
  CssBaseline,
  Drawer,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import type { Shadows } from "@mui/material/styles";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { listTranscripts } from "./modules/storage";
import { NavBar } from "./components/NavBar";
import { Sidebar } from "./components/Sidebar";

// Soft, layered shadow scale — flatter and quieter than MUI's defaults so
// cards read as modern "sheets" instead of floating boxes. Index 0 is "none".
const softShadow = (i: number): string =>
  `0 ${i}px ${i * 3}px rgba(32, 37, 50, ${0.03 + i * 0.01}), 0 ${Math.max(
    i - 1,
    1
  )}px ${Math.max(i, 1)}px rgba(32, 37, 50, ${0.02 + i * 0.008})`;

const shadows: Shadows = Array.from({ length: 25 }, (_, i) =>
  i === 0 ? "none" : softShadow(i)
) as unknown as Shadows;

export const theme = createTheme({
  shape: { borderRadius: 10 },
  shadows,
  palette: {
    mode: "light",
    primary: {
      main: "#FFB81C", // brand-amber
      dark: "#FF6B1A", // brand-orange
      contrastText: "#202532",
    },
    secondary: {
      main: "#C9004B", // brand-crimson
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#B83E0A", // dark orange for small text on light backgrounds; white text passes contrast on this
    },
    background: {
      default: "#FFF9F2", // brand background
      paper: "#FFFFFF", // brand surface
    },
    text: {
      primary: "#202532", // text-primary
      secondary: "#737987", // text-secondary
    },
    divider: "#E9E5E0", // border
  },
  typography: {
    // Noto Sans Arabic covers Arabic glyphs that Roboto lacks; falls back to
    // the system sans-serif stack for everything else. Weights 400–700 are
    // loaded in <head> so 500/600 render as true weights, not synthesized.
    fontFamily: '"Noto Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    // Sentence-case buttons with a quiet lift on hover — the single biggest
    // "default MUI" tell is ALL-CAPS buttons.
    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
        sizeSmall: { paddingInline: 12 },
        sizeLarge: { paddingInline: 22 },
        containedPrimary: {
          boxShadow: "0 1px 2px rgba(255, 107, 26, 0.30)",
          "&:hover": { boxShadow: "0 4px 14px rgba(255, 107, 26, 0.35)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: "#FFFFFF" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        sizeSmall: { height: 24 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
})

// Width of the single history sidebar (sticky on desktop, slide-in drawer on mobile).
const DRAWER_WIDTH = 260

// Height of the fixed NavBar — the Toolbar is forced to this height in
// NavBar.tsx on every breakpoint, so the shell offset below is exact.
const APP_BAR_HEIGHT = 64

// Root loader — supplies the sidebar history on every page.
//
// The history list is rendered by `Sidebar` in this shell, so every route
// needs the transcripts. If the database is unavailable we degrade
// gracefully to an empty history rather than breaking the whole shell.
export async function loader() {
  try {
    const transcripts = await listTranscripts()
    return { transcripts }
  } catch {
    return { transcripts: [] }
  }
}

export default function Root() {
  const { transcripts } = useLoaderData<typeof loader>()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Explicit open/close handlers — a toggle here is what used to make the
  // desktop sidebar open the mobile drawer when a history item was clicked.
  const openMobileDrawer = () => setMobileOpen(true)
  const closeMobileDrawer = () => setMobileOpen(false)

  return (
    <html lang="en">
      <head>
        {/* Must come first: without an explicit charset (and with the server
            sending `Content-Type: text/html` without one), browsers fall back
            to windows-1252 and UTF-8 Arabic text renders as mojibake. */}
        <meta charSet="utf-8" />
        {/* Noto Sans Arabic provides proper Arabic glyph rendering for transcripts. */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* Slim neutral scrollbars and a brand-tinted text selection —
              small details that read as "finished product". */}
          <GlobalStyles
            styles={{
              "::selection": { backgroundColor: "rgba(255, 184, 28, 0.35)" },
              "*": { scrollbarWidth: "thin", scrollbarColor: "#D5CEC5 transparent" },
              "*::-webkit-scrollbar": { width: 10, height: 10 },
              "*::-webkit-scrollbar-track": { background: "transparent" },
              "*::-webkit-scrollbar-thumb": {
                backgroundColor: "#D5CEC5",
                borderRadius: 8,
                border: "2px solid transparent",
                backgroundClip: "content-box",
              },
              "*::-webkit-scrollbar-thumb:hover": { backgroundColor: "#B8B0A6" },
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {/* Fixed app bar with the brand logo and mobile menu toggle. */}
            <NavBar onMenuClick={openMobileDrawer} />
            <Box sx={{ display: "flex", flex: 1, mt: `${APP_BAR_HEIGHT}px` }}>
              {/* Desktop: the one sticky history sidebar, hidden below md.
                  No onClose — choosing an item only navigates, it never
                  opens a drawer. */}
              <Box
                component="nav"
                sx={{
                  display: { xs: "none", md: "flex" },
                  flexDirection: "column",
                  width: DRAWER_WIDTH,
                  flexShrink: 0,
                  position: "sticky",
                  top: APP_BAR_HEIGHT,
                  alignSelf: "flex-start",
                  height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
                  overflowY: "auto",
                  borderRight: 1,
                }}
              >
                <Sidebar transcripts={transcripts} />
              </Box>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
                  p: 3,
                  overflowY: "auto",
                  bgcolor: "background.default",
                }}
              >
                <Outlet />
              </Box>
              {/* Mobile: the same history sidebar inside a slide-in drawer,
                  hidden on md+ where the sticky sidebar takes over. Closes
                  via the backdrop or after choosing an item. */}
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={closeMobileDrawer}
                sx={{
                  width: DRAWER_WIDTH,
                  display: { xs: "block", md: "none" },
                }}
                ModalProps={{ keepMounted: true }}
              >
                <Box component="nav" sx={{ width: DRAWER_WIDTH, height: "100%", flexShrink: 0 }}>
                  <Sidebar transcripts={transcripts} onClose={closeMobileDrawer} />
                </Box>
              </Drawer>
            </Box>
          </Box>
          <ScrollRestoration />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  )
}
