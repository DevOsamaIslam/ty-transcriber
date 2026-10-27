# Glossary — Symbol Index

Use this document to find where each function, variable, class, or component lives.
Search here first before reading entire files.

## Modules

### `app/modules/url/index.ts`
- **`ParsedUrl`** (type) — `{ type: "video" | "playlist", id: string, url: string }`
- **`parseYouTubeUrl(url)`** — Parses a YouTube URL and returns a `ParsedUrl`. Detects watch, youtu.be, and playlist URLs. Throws on invalid URLs. Used by: `transcript` module.
- **`isPlaylist(parsed)`** — Returns `true` if the parsed URL is a playlist type.
- **`extractId(parsed)`** — Returns the ID string from a parsed URL.

### `app/modules/db/index.ts`
- **`getMongoUri()`** — Returns `process.env.MONGODB_URI` or defaults to `mongodb://localhost:27017`.
- **`getDbName()`** — Returns `process.env.MONGODB_DB_NAME` or defaults to `ty-transcriber`.
- **`connectDb(uri?)`** — Lazy Mongoose connection (singleton promise). Safe to call repeatedly; returns the existing connection when ready. Used by: `storage` module.
- **`disconnectDb()`** — Closes the Mongoose connection and resets the cached promise. Used by: tests.

### `app/modules/storage/index.ts`
- **`Transcript`** (interface) — `{ id, title, transcript, sourceUrl, createdAt }` (public DTO; `createdAt` is an ISO string).
- **`TranscriptDoc`** (Typegoose class) — Mongo document for stored transcripts. Stores the lookup id as **`videoId`** (unique, indexed — Mongoose reserves the `id` virtual, so `id` is mapped from `videoId` in the DTO). `createdAt`/`updatedAt` managed by Mongoose timestamps. Requires explicit `type: () => …` per `@prop` because esbuild does not emit decorator metadata.
- **`saveTranscript(data)`** — Upserts the transcript into MongoDB by `videoId` via `findOneAndUpdate` (re-saving overwrites, preserving original `createdAt`).
- **`getTranscript(id)`** — Retrieves a transcript by ID. Returns `null` if not found.
- **`listTranscripts()`** — Returns all transcripts sorted by `createdAt` descending.
- **`deleteTranscript(id)`** — Deletes a transcript document by ID (no-op if missing).

### `app/modules/youtube/index.ts`
- **`TranscriptNotFoundError`** (class) — Custom error thrown when a YouTube video has no captions. Signals the Whisper fallback in the `transcript` orchestrator.
- **`UNAVAILABLE_ERRORS`** (const) — Package error classes meaning "captions unavailable" (`YoutubeTranscriptNotAvailableError`, `YoutubeTranscriptDisabledError`, `YoutubeTranscriptVideoUnavailableError`, `YoutubeTranscriptNotAvailableLanguageError`).
- **`fetchYouTubeTranscript(videoId)`** — Fetches captions via `youtube-transcript`'s named `fetchTranscript` export (v1.3.x has no default export). Returns joined text; maps `UNAVAILABLE_ERRORS` to `TranscriptNotFoundError`, rethrows everything else (e.g. network errors).
- **`VideoMetadata`** (interface) — `{ title, channel, url }` — public metadata for a YouTube video.
- **`getVideoMetadata(url)`** — Fetches title + channel via YouTube's public oEmbed endpoint (plain `fetch`, no key/yt-dlp). Never throws: any failure returns placeholder `{ title: "YouTube Video", channel: "Unknown" }`. Used by: `cli`.

### `app/modules/openrouter/index.ts`
- **`OPENROUTER_BASE_URL`** (const) — `https://openrouter.ai/api/v1`, the base URL the OpenAI SDK is pointed at (OpenRouter's API is OpenAI-compatible).
- **`DEFAULT_OPENROUTER_MODEL`** (const) — Free model `google/gemma-4-26b-a4b-it:free` used unless `OPENROUTER_MODEL` is set.
- **`VideoMetadataLike`** (type) — `{ title, channel, url }` accepted by `formatTranscript`.
- **`TranscriptSources`** (type) — `{ captions?, whisper? }` — the one or two raw transcript sources available for a video.
- **`OpenRouterError`** (class) — Custom error for missing API key / missing sources / empty completion.
- **`getOpenRouterModel()`** — Returns `process.env.OPENROUTER_MODEL` or `DEFAULT_OPENROUTER_MODEL`.
- **`listSources(sources)`** — Renders the provided transcript source(s) as labeled blocks (`=== CAPTIONS (YouTube subtitles) ===` / `=== WHISPER EXTRACTION ===`) for the LLM prompt.
- **`formatTranscript(sources, metadata)`** — Calls OpenRouter via the official `openai` SDK (`new OpenAI({ apiKey, baseURL })`), asking the free LLM to merge and reformat the raw transcript sources into clean structured Markdown. Throws `OpenRouterError` when no sources exist, the key is missing, or the completion is empty. Used by: `cli`.

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
- **`transcribeWithWhisper(audio)`** — Loads the `Xenova/whisper-tiny` model via `@xenova/transformers` and transcribes raw PCM audio in 30 s chunks (`chunk_length_s`) so long recordings are fully transcribed; language is auto-detected.
- **`cleanupAudio(audioPath)`** — Deletes the temporary audio file.
- **`transcribeAudio(url)`** — Orchestrates: download → decode → transcribe → cleanup. Returns the transcript text.

### `app/modules/transcript/index.ts`
- **`TranscriptResult`** (interface) — `{ id, title, transcript, sourceUrl, type? }`
- **`getTranscriptForUrl(url)`** — Main entry point. Parses URL, tries YouTube captions first, falls back to Whisper, saves to storage, returns result. For playlists, returns a placeholder result. Used by: route actions.
- **`TranscriptNotFoundError`** (re-exported) — Re-exported from `youtube` module.

## Utilities

### `app/utils/shell.ts`
- **`runCommand(command)`** — Executes a shell command via `child_process.exec` with a raised `maxBuffer` (16 MiB) and a 10-minute timeout, returns a Promise.
- **`removeFile(filePath)`** — Deletes a file via `fs.promises.unlink`, ignores ENOENT errors.

## Components (UI)

### `app/components/ui/ActionButton.tsx`
- **`ActionVariant`** (type) — `"primary" | "outline" | "text" | "danger"`
- **`ActionButtonProps`** (type) — MUI `ButtonProps` (without `variant`/`color`) + `{ loading?, variant?: ActionVariant, fullWidth? }`
- **`VARIANT_MAP`** (const) — Maps semantic variants to valid MUI `variant` + `color` pairs: `primary` → contained/primary, `outline` → outlined, `text` → text, `danger` → contained/error.
- **`ActionButton`** — Reusable MUI Button with loading state (shows `CircularProgress`, disables button) and semantic variant mapping.

### `app/components/ui/Surface.tsx`
- **`SurfaceProps`** (type) — MUI `CardProps`
- **`Surface`** — MUI `Card` wrapper for consistent elevation and padding.

### `app/components/ui/InputField.tsx`
- **`InputFieldProps`** (type) — MUI `TextFieldProps`
- **`InputField`** — MUI `TextField` with `margin="normal"` and `fullWidth` by default.

### `app/components/ui/LoadingSpinner.tsx`
- **`LoadingSpinner`** — MUI `CircularProgress` with `data-testid="loading-spinner"`.

### `app/components/ui/EmptyState.tsx`
- **`EmptyStateProps`** (type) — `{ heading: string, message: string }`
- **`EmptyState`** — Centered message with heading and body text for empty states.


### `app/components/TranscriptCard.tsx`
- **`TranscriptCardProps`** (type) — `{ id, title, preview, sourceUrl, createdAt }`
- **`TranscriptCard`** — MUI Card showing title, preview text, date, and a View button linking to the transcript page.

### `app/components/TranscriptList.tsx`
- **`TranscriptListProps`** (type) — `{ transcripts: Transcript[] }`
- **`TranscriptList`** — MUI Grid mapping transcripts to `TranscriptCard` components. Shows `EmptyState` when no transcripts exist.

### `app/components/TranscriptViewer.tsx`
- **`TranscriptViewerProps`** (type) — `{ transcript: { id, title, transcript, sourceUrl } }`
- **`TranscriptViewer`** — MUI Surface showing full transcript text with a Copy-to-clipboard button.

### `app/components/UrlForm.tsx`
- **`UrlFormProps`** (type) — `{ onSubmit?: (url: string) => void, loading?: boolean, serverError?: string | null }`
- **`UrlForm`** — URL entry form. With `onSubmit`: controlled form (test path). Without: React Router `<Form method="post">` posting `name="url"` to the route action. Validates non-empty input, shows `serverError`.

## Routes

### `app/routes.ts`
- Flat route config using `index()` and `route()` from `@react-router/dev/routes`.

### `app/root.tsx`
- **`theme`** — MUI theme with custom primary color and component defaults.
- **`Root`** — SSR root layout with `ThemeProvider`, `CssBaseline`, `Outlet`, `ScrollRestoration`. (`LiveReload` removed — not exported in v8.)

### `app/routes/index.tsx`
- **`loader`** — Calls `listTranscripts()`, returns plain object `{ transcripts }` (v8: no `json()` helper).
- **`action`** — Reads `formData.get("url")`, calls `getTranscriptForUrl()`, redirects to `/transcripts/:id`. Errors return `data({ error }, { status })` (400/422).
- **`Index`** — Home page. Uses `useLoaderData`, `useActionData`, `useNavigation` (submitting state) to render `UrlForm` and `TranscriptList`.

### `app/routes/transcripts.$id.tsx`
- **`loader`** — Calls `getTranscript(id)`, redirects to home if not found, returns plain object `{ transcript }`.
- **`TranscriptRoute`** — Uses `useLoaderData` to render `TranscriptViewer`.

## Entry Points

### `app/entry.client.tsx`
- Client-side hydration entry using `HydratedRouter` from `react-router/dom` (v8 moved it off the main entry — matches the plugin's built-in default template).

### `app/entry.server.tsx`
- Omitted — React Router v8 provides a built-in default SSR entry (streaming, error boundaries, bot detection). A custom entry that wires `createRequestHandler` to a global build fails at runtime with "Cannot read properties of undefined (reading 'routes')"; if re-adding one, accept the framework-provided `EntryContext` in `handleRequest(request, status, headers, context)` instead.

### `cli/index.ts` (project root)
- Guided CLI binary (`npm run cli`, runs via `node --import tsx`): prompts for a YouTube URL, then shows step progress — `[1/5]` metadata (`getVideoMetadata`), `[2/5]` existing captions (`fetchYouTubeTranscript`; when found, download + Whisper are **skipped** — captions are the cheapest source), `[3/5]` Whisper extraction (only when captions are missing: `downloadAudio` → `decodeAudioToPCM` → `transcribeWithWhisper` → `cleanupAudio`), `[4/5]` LLM formatting — whichever transcript was obtained is fed into `formatTranscript` as a labeled source (OpenRouter via OpenAI SDK; warned+skipped without `OPENROUTER_API_KEY`) — `[5/5]` saves the markdown doc (`writeMarkdownFile`). Uses `node:readline/promises`; re-asks until a valid single-video URL is entered.

### `react-router.config.ts` (project root)
- React Router v8 framework configuration (`ssr: true`). Must live at the project root next to `vite.config.ts`; a copy inside `app/` is ignored by the plugin.

## Configuration

- **`vite.config.ts`** — Vite config with React Router plugin (skipped during tests) and Vitest configuration (jsdom environment).
- **`vitest.setup.ts`** — Test setup with `@testing-library/jest-dom` and cleanup after each test.
- **`tsconfig.json`** — TypeScript configuration with path aliases (`@/*` → `./app/*`); includes `cli/**/*.ts`.
- **`package.json`** — Dependencies: React Router v8, MUI v6, Vitest, `@testing-library/react`, `youtube-transcript`, `@xenova/transformers`, `openai` (OpenRouter via baseURL), dev `tsx` (CLI runner). Scripts include `cli` (`node --env-file-if-exists=.env --import tsx cli/index.ts`, so a local `.env` with `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` is auto-loaded).
- **`transcripts/`** — Gitignored runtime output directory for CLI-generated markdown docs.
### `app/components/ui/index.ts`
- Barrel export for all UI primitives.