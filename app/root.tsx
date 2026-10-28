import { useState } from "react";
import {
  Box,
  CssBaseline,
  Drawer,
  ThemeProvider,
  createTheme,
} from "@mui/material";
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

export const theme = createTheme({
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
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
      },
    },
  },
})

// Width of the single history sidebar (sticky on desktop, slide-in drawer on mobile).
const DRAWER_WIDTH = 260

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
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {/* Fixed app bar with the brand logo and mobile menu toggle. */}
            <NavBar onMenuClick={openMobileDrawer} />
            <Box sx={{ display: "flex", flex: 1, mt: 4 }}>
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
                  top: 0,
                  alignSelf: "flex-start",
                  height: "100vh",
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
                <Box component="nav" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
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
