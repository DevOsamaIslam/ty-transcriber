# Glossary — Symbol Index

Use this document to find where each function, variable, class, or component lives.
Search here first before reading entire files.

## Modules

### `app/modules/url/index.ts`
- **`ParsedUrl`** (type) — `{ type: "video" | "playlist", id: string, url: string }`
- **`parseYouTubeUrl(url)`** — Parses a YouTube URL and returns a `ParsedUrl`. Detects watch, youtu.be, and playlist URLs. Throws on invalid URLs. Used by: `transcript` module.
- **`isPlaylist(parsed)`** — Returns `true` if the parsed URL is a playlist type.
- **`extractId(parsed)`** — Returns the ID string from a parsed URL.

### `app/modules/playlist/index.ts`
- **`PlaylistVideo`** (type) — `{ id, url }` — one video of a playlist.
- **`PlaylistInfo`** (type) — `{ id, title }` — playlist id + title.
- **`fetchPlaylist(playlistUrl)`** — Lists every video of a YouTube playlist via `yt-dlp --flat-playlist --dump-single-json` (no downloads, no Whisper yet). Returns `{ info, videos }`. Used by: `transcript` module, `cli`.

### `app/modules/db/index.ts`
- **`getMongoUri()`** — Returns `process.env.MONGODB_URI` or defaults to `mongodb://localhost:27017`.
- **`getDbName()`** — Returns `process.env.MONGODB_DB_NAME` or defaults to `ty-transcriber`.
- **`connectDb(uri?)`** — Lazy Mongoose connection (singleton promise). Safe to call repeatedly; returns the existing connection when ready. Fails fast (8s `serverSelectionTimeoutMS`) and logs connection attempts/outcomes verbosely so a down database surfaces as an error instead of leaving a transcription job stuck on the "saving" step. Used by: `storage` module.
- **`disconnectDb()`** — Closes the Mongoose connection and resets the cached promise. Used by: tests.

### `app/modules/storage/index.ts`
- **`Transcript`** (interface) — `{ id, title, originalTitle?, transcript, sourceUrl, channel?, channelId?, playlistId?, playlistIndex?, source?, language?, uploadDate?, videoDate?, createdAt }` (public DTO; `createdAt` is an ISO string; `source` is `"captions" | "whisper"`; `language` is the ISO 639-1 transcript language, undefined when the video's default language was used).
- **`TranscriptDoc`** (Typegoose class) — Mongo document for stored transcripts. Stores the lookup id as **`videoId`** (unique, indexed — Mongoose reserves the `id` virtual, so `id` is mapped from `videoId` in the DTO). Also stores `channel`, `channelId`, `playlistId`, `playlistIndex`, `source`, `language`, `uploadDate`, `videoDate` and `originalTitle`. `createdAt`/`updatedAt` managed by Mongoose timestamps. Requires explicit `type: () => …` per `@prop` because esbuild does not emit decorator metadata.
- **`saveTranscript(data)`** — Upserts the transcript into MongoDB by `videoId` via `findOneAndUpdate` (re-saving overwrites, preserving original `createdAt`); optionally stores `channel`, `channelId`, `playlistId`, `playlistIndex`, `source`, `language`, `uploadDate`, `videoDate` and `originalTitle`.
- **`getTranscript(id)`** — Retrieves a transcript by ID. Returns `null` if not found.
- **`TranscriptListFilter`** (interface) — `{ channel?, playlistId?, query?, source?, language? }`: `channel`/`playlistId` restrict to one channel/playlist; `query` does a case-insensitive match against title, channel, original title and source URL; `source` is `"captions" | "whisper"`; `language` is an ISO 639-1 code.
- **`listTranscripts(filter?)`** — Returns all transcripts sorted by `createdAt` descending; optional `TranscriptListFilter` (`channel`, `playlistId`, `query`, `source`, `language`). Used by: `routes/index`, `routes/transcriptsChannel`, `routes/transcriptsPlaylist`, `root`.
- **`deleteTranscript(id)`** — Deletes a transcript document by ID (no-op if missing).

### `app/modules/youtube/index.ts`
- **`TranscriptNotFoundError`** (class) — Custom error thrown when a YouTube video has no captions. Signals the Whisper fallback in the `transcript` orchestrator.
- **`UNAVAILABLE_ERRORS`** (const) — Package error classes meaning "captions unavailable" (`YoutubeTranscriptNotAvailableError`, `YoutubeTranscriptDisabledError`, `YoutubeTranscriptVideoUnavailableError`, `YoutubeTranscriptNotAvailableLanguageError`).
- **`FetchYouTubeTranscriptOptions`** (type) — `{ language?: string }` — ISO 639-1 language code for the captions; omitted means English is tried first as an "auto-detect" default, falling back to the video's default caption language if English is unavailable.
- **`fetchYouTubeTranscript(videoId, opts?)`** — Fetches captions via `youtube-transcript`'s named `fetchTranscript` export. When no language is requested, tries `lang: "en"` first as an "auto-detect" default, then falls back to the library's default track (`captionTracks[0]`) if English isn't available. Returns joined text; maps `UNAVAILABLE_ERRORS` to `TranscriptNotFoundError`, rethrows everything else (e.g. network errors).
- **`VideoMetadata`** (interface) — `{ title, channel, url, id?, originalTitle?, channelId?, uploadDate?, videoDate? }` — public metadata for a YouTube video; the optional fields are populated when fetched via yt-dlp.
- **`getVideoMetadata(url)`** — Fetches title + channel via YouTube's public oEmbed endpoint (plain `fetch`, no key/yt-dlp). Never throws: any failure returns placeholder `{ title: "YouTube Video", channel: "Unknown" }`. Used by: `cli`, `routes`.
- **`fetchVideoMetadata(url)`** — Fetches rich metadata via `yt-dlp --dump-single-json` (video id, title, original title, channel name + id, upload / video date). Falls back to `getVideoMetadata` (oEmbed) when yt-dlp is unavailable or fails. Used by: `transcript`, `cli`.

### `app/modules/openrouter/index.ts`
- **`OPENROUTER_BASE_URL`** (const) — `https://openrouter.ai/api/v1`, the base URL the OpenAI SDK is pointed at (OpenRouter's API is OpenAI-compatible).
- **`DEFAULT_OPENROUTER_MODEL`** (const) — Free model `google/gemma-4-26b-a4b-it:free` used unless `OPENROUTER_MODEL` is set.
- **`VideoMetadataLike`** (type) — `{ title, channel, url }` accepted by `formatTranscript`.
- **`TranscriptSources`** (type) — `{ captions?, whisper? }` — the one or two raw transcript sources available for a video.
- **`OpenRouterError`** (class) — Custom error for missing API key / missing sources / empty completion.
- **`getOpenRouterModel()`** — Returns `process.env.OPENROUTER_MODEL` or `DEFAULT_OPENROUTER_MODEL`.
- **`listSources(sources)`** — Renders the provided transcript source(s) as labeled blocks (`=== CAPTIONS (YouTube subtitles) ===` / `=== WHISPER EXTRACTION ===`) for the LLM prompt.
- **`formatTranscript(sources, metadata, language?)`** — Calls OpenRouter via the official `openai` SDK (`new OpenAI({ apiKey, baseURL })`), asking the free LLM to merge and reformat the raw transcript sources into clean structured Markdown. Accepts an optional `language` (ISO 639-1) hint passed to the model so it responds in the transcript's language (e.g. Arabic). Wraps OpenAI SDK API errors into descriptive `OpenRouterError` messages including HTTP status, error type and code. Throws `OpenRouterError` when no sources exist, the key is missing, or the completion is empty. Used by: `cli`, `routes/index`.

### `app/modules/doc/index.ts`
- **`DocMetadata`** (type) — `{ title, channel, url }` — written into the generated markdown as the header block.
- **`DOC_OUTPUT_DIR`** (const) — Default output directory `transcripts` (gitignored).
- **`slugify(title)`** — Turns a title into a safe filename slug (lowercase alnum + dashes); falls back to `"transcript"`.
- **`buildMarkdown(metadata, body)`** — Builds the doc: starts with the metadata header (`# title`, `**Channel:**`, `**URL:**`), a `---` divider, then the transcript body.
- **`docFileName(metadata, videoId)`** — `"<slugified title>-<videoId>.md"` (id suffix disambiguates same-titled videos).
- **`writeMarkdownFile(metadata, videoId, body, dir?)`** — Creates `dir` (`transcripts` by default) and writes the built markdown; returns the file path.

### `app/modules/whisper/index.ts`
- **`downloadAudio(url)`** — Downloads audio for the linked video only (`--no-playlist`, so `watch?v=…&list=…` URLs do not pull the whole playlist) via `yt-dlp`. Returns the local MP3 file path.
- **`decodeAudioToPCM(audioPath)`** — Decodes the MP3 to raw 16 kHz mono Float32 PCM via ffmpeg (transformers.js cannot decode files in Node — no `AudioContext`) and returns a `Float32Array`.
- **`TranscribeWithWhisperOptions`** (type) — `{ language?: string }` — ISO 639-1 language code to transcribe in; omitted lets Whisper auto-detect the language.
- **`transcribeWithWhisper(audio, opts?)`** — Loads the `Xenova/whisper-tiny` model via `@xenova/transformers` and transcribes raw PCM audio in 30 s chunks (`chunk_length_s`) so long recordings are fully transcribed; passes `language` to the model when provided, otherwise auto-detects.
- **`cleanupAudio(audioPath)`** — Deletes the temporary audio file.
- **`transcribeAudio(url, opts?)`** — Orchestrates: download → decode → transcribe → cleanup. Returns the transcript text. Threads `language` to `transcribeWithWhisper`.

### `app/modules/transcript/index.ts`
- **`TranscriptResult`** (interface) — `{ id, title, originalTitle?, transcript, sourceUrl, channel?, channelId?, playlistId?, playlistIndex?, source?, skipped?, type?, language?, uploadDate?, videoDate? }` — `source` is `"captions" | "whisper"`; `skipped` is true when download/transcription was skipped because captions exist; `language` is the requested ISO 639-1 language (undefined = video's default language).
- **`getTranscriptForUrl(url, opts?)`** — Transcribes a single video: YouTube captions first (download + Whisper skipped when captions exist), Whisper fallback otherwise; saves under the video's channel. `opts.language` is passed to captions/Whisper. Throws on playlist URLs. Used by: route actions.
- **`getTranscriptsForPlaylist(playlistUrl, opts?)`** — Lists all videos of a playlist and transcribes each one (captions or Whisper), persisting each under `channel/playlist` with its 1-based `playlistIndex`; a failing video never aborts the rest. `opts.language` applies to every video. Used by: route actions, CLI.
- **`TranscriptNotFoundError`** (re-exported) — Re-exported from `youtube` module.

## Utilities

### `app/utils/shell.ts`
- **`runCommand(command)`** — Executes a shell command via `child_process.exec` with a raised `maxBuffer` (16 MiB) and a 10-minute timeout, returns a Promise.
- **`runCommandWithOutput(command)`** — Like `runCommand`, but resolves with the command's stdout (e.g. yt-dlp JSON output).
- **`removeFile(filePath)`** — Deletes a file via `fs.promises.unlink`, ignores ENOENT errors.

### `app/utils/format.ts`
- **`formatDate(value)`** — Formats an ISO date string as a short locale date ("Jan 2, 2024"); returns the raw value unchanged when the date is invalid. Used by: `Sidebar`, `TranscriptCard`, `TranscriptViewer`.
- **`excerpt(text, max = 180)`** — Collapses whitespace runs and truncates to `max` characters with an ellipsis; used to derive transcript-card previews from transcript bodies.

## Components (UI)

### `app/components/ui/ActionButton.tsx`
- **`ActionVariant`** (type) — `"primary" | "outline" | "text" | "danger"`
- **`ActionButtonProps`** (type) — MUI `ButtonProps` (without `variant`/`color`) + `{ loading?, variant?: ActionVariant, fullWidth? }`
- **`VARIANT_MAP`** (const) — Maps semantic variants to valid MUI `variant` + `color` pairs: `primary` → contained/primary, `outline` → outlined, `text` → text, `danger` → contained/error.
- **`ActionButton`** — Reusable MUI Button with loading state (shows `CircularProgress`, disables button) and semantic variant mapping.

### `app/components/ui/Surface.tsx`
- **`SurfaceProps`** (type) — MUI `CardProps`
- **`Surface`** — MUI `Card` wrapper: flat (elevation 0 by default) with a hairline border and a fixed 12px radius so surfaces read as consistent "sheets"; `elevation` and `sx` remain overridable by the caller.

### `app/components/ui/InputField.tsx`
- **`InputFieldProps`** (type) — MUI `TextFieldProps`
- **`InputField`** — MUI `TextField` with `margin="normal"` and `fullWidth` defaults; both are overridable by the caller (e.g. `margin="none"` inside dense layouts).

### `app/components/ui/LoadingSpinner.tsx`
- **`LoadingSpinner`** — MUI `CircularProgress` with `data-testid="loading-spinner"`.

### `app/components/ui/EmptyState.tsx`
- **`EmptyStateProps`** (type) — `{ heading: string, message: string, icon?: ReactNode }`
- **`EmptyState`** — Centered empty-state block: optional icon inside a soft brand-tinted circle, bold heading and secondary message.

### `app/components/ui/PageHeader.tsx`
- **`PageHeaderProps`** (type) — `{ title, overline?, subtitle?, backTo?: { to, label }, actions? }`.
- **`PageHeader`** — Consistent page header used by every page route: optional back link, uppercase brand-accented overline, h1 title, subtitle, and a right-aligned action area.

### `app/components/ui/Logo.tsx`
- **`LogoProps`** (type) — `{ sx? }`
- **`Logo`** — Brand mark: renders the `public/logo.png` asset (32x32) plus the "ty-transcriber" wordmark in `currentColor`, so it adapts to the app bar. Linked to the home page from `NavBar`.


### `app/components/TranscriptCard.tsx`
- **`TranscriptCardProps`** (type) — `{ id, title, preview?, transcript?, sourceUrl, createdAt, source?, channel? }` — `source` is `"captions" | "whisper"`. `preview` is derived from `transcript` (whitespace-collapsed 180-char excerpt) when omitted.
- **`TranscriptCard`** — MUI Card for the results grid: the whole card is a react-router `Link` to the transcript page (client-side navigation), it lifts on hover, the title clamps to 2 lines and the preview to 3, the source renders as a brand-tinted chip with an explanatory tooltip ("download/transcription skipped" for captions), and the footer holds the date plus a View link.

### `app/components/TranscriptList.tsx`
- **`TranscriptListProps`** (type) — `{ transcripts: Array<{ id, title, transcript, sourceUrl, createdAt, source?, channel? }> }` — items are forwarded whole to `TranscriptCard` (so `source`/`channel` reach the cards).
- **`TranscriptList`** — MUI Grid mapping transcripts to `TranscriptCard` components. Shows `EmptyState` (with a video icon) when no transcripts exist.

### `app/components/TranscriptViewer.tsx`
- **`TranscriptViewerProps`** (type) — `{ transcript: Transcript }` — `Transcript` is the full storage DTO (title, channel, source, language, dates, source URL, id).
- **`TranscriptViewer`** — Document-style viewer inside a `Surface`: a header block (title, channel chip + source chip with tooltip, saved date and a Copy-to-clipboard button) sits above a compact label/value metadata grid (source URL, playlist position, language, upload/video date, original title, id) and the body rendered as Markdown through the `Markdown` primitive. Channel and source appear once, as header chips. All text uses `dir="auto"` so Arabic/RTL transcripts render right-to-left without forcing the whole page RTL.

### `app/components/UrlForm.tsx`
- **`UrlFormProps`** (type) — `{ onSubmit?: ({ url, language }: { url: string; language: string }) => void, loading?: boolean, serverError?: string | null }`
- **`UrlForm`** — URL entry form with a transcript language `LanguageSelect`. With `onSubmit`: controlled form (test path), called with `{ url, language }`. Without: React Router `<Form method="post">` posting `name="url"` and `name="language"` to the route action. Validates non-empty input, shows `serverError`.

### `app/components/ui/LanguageSelect.tsx`
- **`LanguageSelectProps`** (type) — `{ name?, value?, onChange?, label?, helperText?, error?, sx? }` — `value` is an ISO 639-1 code; `""` means auto-detect (video's default).
- **`LanguageSelect`** — MUI `Select` with 10 languages (English, Spanish, Arabic, French, German, Portuguese, Italian, Russian, Japanese, Korean) plus an "Auto-detect (video's default)" option; forwards `name` so the value posts to the route action. Exports the `LANGUAGES` constant (11 entries).

### `app/components/ui/StepsBox.tsx`
- **`StepsBoxProps`** (type) — `{ steps: string[], activeIndex: number, heading? }`.
- **`StepsBox`** — Animated step-by-step progress box inside a MUI `Surface`. Shows each step with a numbered circle (pending grey / active with amber ring + spinner / complete amber with dark check) and a pulse animation on the active step (the `pulse` keyframes are defined in the component's own sx — the old code referenced an undefined keyframe); the step number stays visible under the spinner ring.

### `app/components/ui/Markdown.tsx`
- **`MarkdownProps`** (type) — `{ children: string }` — markdown source to render.
- **`Markdown`** — Small markdown-to-MUI renderer: headings, thematic breaks, amber-tinted blockquotes, lists with colored bullet/number markers, bold, italic, inline code (styled as a tinted code chip via `Typography component="code"` — a raw `<code sx>` previously dropped the styling) and warning-colored links. All text uses `dir="auto"` for RTL support.

### `app/components/UrlForm.tsx`
- **`UrlFormProps`** (type) — `{ onSubmit?: ({ url, language, format }: { url: string; language: string; format: boolean }) => void, loading?: boolean, serverError?: string | null, progress?: JobProgress | null }`
- **`UrlForm`** — URL entry form inside a `Surface` card with an amber top accent and a "New transcription" heading: URL `InputField`, transcript language `LanguageSelect`, and a "Format with LLM" checkbox with a tooltip help icon. With `onSubmit`: controlled form (test path), called with `{ url, language, format }`. Without: React Router `<Form method="post">` posting `url`, `language` and `format` to the route action. While a job is in flight, renders an animated `StepsBox` below the form driven by real server progress (SSE). Validates non-empty input, shows `serverError`.

### `app/components/NavBar.tsx`
- **`NavBarProps`** (type) — `{ onMenuClick?: () => void }` — opens the mobile history drawer from the hamburger (hidden above the `md` breakpoint where the sticky sidebar is permanent).
- **`NavBar`** — Fixed top app bar: brand `Logo` linked to the home page and a mobile menu toggle wired to `onMenuClick`. Flat and translucent (85% white + backdrop blur) with a hairline bottom border; the `Toolbar` is forced to a fixed 64px height on every breakpoint so the shell's `APP_BAR_HEIGHT` offset is exact (MUI's responsive 56→64px default would overlap content). Rendered by `root.tsx`.

### `app/components/Sidebar.tsx`
- **`SidebarProps`** (type) — `{ transcripts: Transcript[], onClose? }` — `transcripts` are the stored transcripts newest first; `onClose` is called when a history item is chosen — passed only inside the mobile drawer (closes it); the desktop sticky sidebar omits it so clicks just navigate.
- **`Sidebar`** — History panel: uppercase "History" label with an item-count chip, each saved transcript as a rounded link to `/transcripts/:id` with its date and source ("Captions" / "Whisper" / "Unknown"), the current route's item highlighted (`useLocation`), an icon empty state when none exist, and an internally scrolling list. The panel is plain paper — the desktop shell draws the dividing border (previously both drew one, doubling it). The app's single sidebar: sticky on desktop, inside a slide-in drawer on mobile.

### `app/components/TranscriptFilter.tsx`
- **`TranscriptFilter()`** — Search/filter bar for the stored transcripts on the home page, grouped in a bordered paper toolbar. Text search (`q`) matches title, channel, original title and source URL; dropdowns filter by source (`captions`/`whisper`) and language, plus a channel input. Values live in URL search params, so changing a field re-runs the route loader; includes a clear-filters button (the redundant active-filter summary chip was removed in the design overhaul).

## Routes

### `app/routes.ts`
- Flat route config using `index()` and `route()` from `@react-router/dev/routes`. Routes: `/`, `/api/job/:jobId`, `/transcripts/playlist/:playlistId`, `/transcripts/channel/:channel`, `/transcripts/:id`.

### `app/modules/job.ts`
- **`JobStep`** (type) — `"metadata" | "captions" | "formatting" | "saving" | "done" | "error"`.
- **`JobProgress`** (interface) — `{ step, message, error?, transcriptId? }` — real-time progress of a background transcription job.
- **`createJob()`** — Registers a new job in the in-memory store and returns its id.
- **`updateJob(jobId, progress)`** — Updates a job's progress (called by the route action at each real step).
- **`getJob(jobId)`** — Reads a job's current progress (polled by the SSE route).
- **`deleteJob(jobId)`** — Removes a job from the store.

### `app/routes/api.job.$jobId.tsx`
- **`loader`** — SSE endpoint that streams `JobProgress` events for a given job id to the client via `text/event-stream`.

### `app/routes/index.tsx`
- **`loader`** — Reads `q`, `source`, `language` and `channel` search params into a `TranscriptListFilter`, calls `listTranscripts(filter)`, returns `{ transcripts, filter }` (v8: no `json()` helper).
- **`action`** — Reads `formData.get("url")`, `formData.get("language")` and `formData.get("format")` (checkbox, `"on"` when checked). Playlists call `getTranscriptsForPlaylist(url, { language })` then redirect to `/transcripts/playlist/:playlistId`. Single videos: creates a job, runs transcription in the background (metadata → captions → optional LLM formatting → saving), writes progress to the job store at each step, and returns `{ jobId }` immediately. On formatting failure the job step is set to `error` with the message; invalid/failed input returns `data({ error }, { status })` (400/422).
- **`Index`** — Home page. Uses `useLoaderData`, `useActionData`, `useNavigation` (submitting state) to render `UrlForm`, the `TranscriptFilter` bar and the filtered `TranscriptList` with a result count; opens an SSE connection to `/api/job/:jobId` when a job id appears in the action data, updates local `progress` from each event, and redirects to `/transcripts/:id` on `done`.

### `app/routes/transcripts.$id.tsx`
- **`loader`** — Calls `getTranscript(id)`, redirects to home if not found, returns plain object `{ transcript }`.
- **`action`** — Re-triggers LLM formatting of the stored transcript in a background job (`formatTranscript` on the saved text keyed by its `source`, then `saveTranscript` overwrites it preserving `createdAt`); returns `{ jobId }` so the client streams progress via SSE to `/api/job/:jobId`.
- **`TranscriptRoute`** — Renders the transcript `PageHeader` (back link, Re-format action in the header) plus the `TranscriptViewer` (which carries the Copy-to-clipboard button in its header); while a job is in flight shows a `StepsBox` driven by SSE progress, navigates back to the refreshed transcript page on `done`, and shows an `Alert` on error.

### `app/routes/transcriptsPlaylist.tsx`
- **`loader`** — Calls `listTranscripts({ playlistId })`, redirects home if the param is missing, returns `{ transcripts, playlistId }`.
- **`TranscriptsPlaylistRoute`** — Lists every transcript saved under a playlist (`channel/playlist` view).

### `app/routes/transcriptsChannel.tsx`
- **`loader`** — Calls `listTranscripts({ channel })`, redirects home if the param is missing, returns `{ transcripts, channel }`.
- **`TranscriptsChannelRoute`** — Lists every transcript saved under a channel.

## Entry Points

### `app/entry.client.tsx`
- Client-side hydration entry using `HydratedRouter` from `react-router/dom` (v8 moved it off the main entry — matches the plugin's built-in default template).

### `app/entry.server.tsx`
- Omitted — React Router v8 provides a built-in default SSR entry (streaming, error boundaries, bot detection). A custom entry that wires `createRequestHandler` to a global build fails at runtime with "Cannot read properties of undefined (reading 'routes')"; if re-adding one, accept the framework-provided `EntryContext` in `handleRequest(request, status, headers, context)` instead.

### `app/root.tsx`
- **`theme`** (const) — MUI theme (light mode) using the brand palette: primary `#FFB81C` (amber) with dark contrast text `#202532`, secondary `#C9004B` (crimson) with white contrast text, warning `#B83E0A` (dark orange) for small text on light backgrounds, background `#FFF9F2`, paper `#FFFFFF`, text primary `#202532`, text secondary `#737987`, divider `#E9E5E0`. Typography uses `Noto Sans Arabic` as the primary font family (weights 400–700 loaded from Google Fonts in `<head>`), falling back to the system sans-serif stack, so Arabic transcripts render with proper glyph coverage; headings are weight 700 with tight letter-spacing, body1 uses a 1.7 line-height for transcript readability, and buttons are sentence-case. The theme also sets `shape.borderRadius: 10`, a soft layered shadow scale (quieter than MUI defaults), and component overrides: sentence-case non-elevated buttons with an orange-tinted hover shadow, 8px-radius inputs, 8px-radius list items, chips and alerts. ~80–90% of the interface stays neutral; warm colors are reserved for important actions and branding. Used by `ThemeProvider`; extended here rather than per component.
- **`GlobalStyles`** — Mounted right after `CssBaseline` in `Root`: slim neutral scrollbars (webkit + Firefox) and a brand-tinted amber text selection.
- **CSS custom properties** — `:root` in `index.html` exposes `--brand-amber`, `--brand-orange`, `--brand-coral`, `--brand-crimson`, `--text-dark-orange`, `--background`, `--surface`, `--text-primary`, `--text-secondary`, `--border`, and `--brand-gradient`.
- **`loader`** — Lists all stored transcripts (`listTranscripts`; degrades to `[]` if the database is unavailable) so the shell's history sidebar is populated on every route.
- **`Root`** — App shell: fixed `NavBar` app bar (hamburger opens the mobile drawer), the one sticky history `Sidebar` on desktop — it starts below the fixed app bar and scrolls with the page — item clicks only navigate, they never open a drawer — or the same `Sidebar` in a temporary `Drawer` on mobile (closes on item click / backdrop). Drawer state uses explicit open/close handlers, never a toggle. (`LiveReload` is not exported in React Router v8 — do not re-add.)
- **`<meta charSet="utf-8" />`** — Must remain the first element in `<head>`: the server sends `Content-Type: text/html` without a charset, so without this declaration browsers fall back to Windows-1252 and UTF-8 Arabic (titles/transcripts) renders as mojibake (`Ø§Ù„Ù†Ø¨ÙŠ…`).

### `cli/index.ts` (project root)
- Guided CLI binary (`npm run cli`, runs via `node --import tsx`): prompts for a YouTube video **or playlist** URL, then an optional transcript language (empty = video's default language). Accepts a `--format` flag (default off): when set, the transcript is fed through the LLM formatter (`formatTranscript`) before saving; when omitted, the raw transcript is saved. Single video: `[1/N]` metadata (`getVideoMetadata`), `[2/N]` existing captions (`fetchYouTubeTranscript` with `language`; when found, download + Whisper are **skipped**), `[3/N]` Whisper extraction (only when captions are missing: `downloadAudio` → `decodeAudioToPCM` → `transcribeWithWhisper` with `language` → `cleanupAudio`), optional `[4/N]` LLM formatting (only with `--format`), `[last/N]` saves the markdown doc (`writeMarkdownFile`) under `transcripts/<channel>/`. Playlist: lists every video (`fetchPlaylist`), then per video — metadata, captions or "**download/transcription skipped**", optional Whisper download+transcribe fallback, optional LLM formatting, saves under `transcripts/<channel>/<playlist>/`; videos with no transcript at all are warned and skipped. Uses `node:readline/promises`; re-asks until a valid URL is entered.

### `app/routes/api.agent.transcripts.$id.tsx`
- **`loader`** — Agent-facing transcript retrieval endpoint (`GET /api/agent/transcripts/:id`), no account/session required. Returns `{ transcript }` as JSON; 400 on missing id, 404 (via `data()`) when not found. This is the merchant backend the Agent Commerce Gateway fronts as the paid `transcript_get` resource (0.01 USDC per retrieval via x402); see `agent-commerce/config.example.yaml`.

### `agent-commerce/` (project root)
- **`config.example.yaml`** — Agent Commerce Gateway configuration: exposes `transcript_get` as a paid resource (`pricing: fixed, amount "0.01", currency USDC`, `payments: [x402]`, `expose: [http, mcp]`) proxying `${MERCHANT_API_BASE_URL}/api/agent/transcripts/{id}`. Defaults to Base Sepolia USDC with the public x402.org facilitator; `payTo` comes from `MERCHANT_WALLET`. Copy to `config.yaml` and run via the `@devlab.group/agent-commerce` CLI.
- **`README.md`** — Gateway setup guide: surfaces (MCP `/mcp`, HTTP invoke), env vars, Base Sepolia vs mainnet notes.

### `react-router.config.ts` (project root)
- React Router v8 framework configuration (`ssr: true`). Must live at the project root next to `vite.config.ts`; a copy inside `app/` is ignored by the plugin.

## Configuration

- **`vite.config.ts`** — Vite config with React Router plugin (skipped during tests) and Vitest configuration (jsdom environment). Inlines the entire MUI + Emotion chain into the SSR bundle (`ssr.noExternal: ["@mui/*", "@emotion/*"]`) because @mui/icons-material's ESM build directory-imports `@mui/material/utils`, which Node's native ESM resolver rejects; the whole chain must be inlined together so Vite's resolver handles every import (mixing inlined ESM with externalized CJS breaks default-export interop). Also pre-bundles MUI/Emotion via `optimizeDeps` and configures `server.hmr` + `server.watch.ignored` so hot reloading isn't blocked by re-processing hundreds of modules on every file change.
- **`vitest.setup.ts`** — Test setup with `@testing-library/jest-dom` and cleanup after each test.
- **`tsconfig.json`** — TypeScript configuration with path aliases (`@/*` → `./app/*`); includes `cli/**/*.ts`.
- **`package.json`** — Dependencies: React Router v8, MUI v9, Vitest, `@testing-library/react`, `youtube-transcript`, `@xenova/transformers`, `openai` (OpenRouter via baseURL), dev `tsx` (CLI runner). Scripts include `cli` (`node --env-file-if-exists=.env --import tsx cli/index.ts`, so a local `.env` with `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` is auto-loaded).
- **`transcripts/`** — Gitignored runtime output directory for CLI-generated markdown docs. Single videos go to `transcripts/<channel>/`; playlists to `transcripts/<channel>/<playlist>/`.
### `app/components/ui/index.ts`
- Barrel export for all UI primitives.