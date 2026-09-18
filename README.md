# MusicPlus

MusicPlus is a full-stack music discovery and player project. The React client combines a local demo playlist with Last.fm discovery data and Jamendo search. Clerk provides authentication, while the Express server supplies a health endpoint and an optional MongoDB connection. No playlist API is implemented.

## Current features

- Responsive desktop and mobile application shell
- Clerk sign-up, email verification, sign-in, and password reset
- Shared local/Jamendo playback with track selection, next/previous, and progress display
- Last.fm global top artists, tracks, tags, and artist albums
- URL-driven Jamendo catalog search with loading, empty, and error states
- Global discovery charts shown after sign-in
- Express health endpoint with optional MongoDB connectivity

Demo mix cards are display-only. The demo-playlist section is not listening history. Songs and playable Jamendo search results start their own ordered playback queues. Last.fm discovery remains metadata-only. Playlists, favorites, listening history, and queue editing remain future work.

## Playback behavior (Phase 2)

One provider above the routes owns one audio element, the selected track, an immutable queue snapshot, media state, progress, loading, and fixed public errors. Local and Jamendo adapters use `local:` and `jamendo:` IDs; Last.fm records are never adapted to audio. Supplied Jamendo attribution and Creative Commons license links remain available in search and player views.

Only the page-load default stays paused: page load never starts audio. Explicit Play starts the selected track, including a track selected with Next/Previous while paused. Selecting a local row starts the local catalog at that row. Selecting a search result starts the current playable results in their displayed order; missing or unsafe stream URLs are labelled unavailable and excluded from that queue. Jamendo playback uses the documented `audio` stream, never `audiodownload`: [official tracks contract](https://developer.jamendo.com/v3.0/tracks).

Manual Next wraps from the last track to the first. Previous restarts the current track after two seconds; otherwise it moves backward and wraps at the beginning. These controls preserve playing/paused intent. Natural completion advances exactly once within the queue and stops on the final track. There is no repeat mode. Play can restart a completed final track.

`playTrack(track)` starts a singleton queue. `playQueue(tracks, startIndex)` copies its input before selection. Empty input clears playback; an invalid index or unavailable audio is rejected safely without replacing the current queue. Search changes, clearing, and navigation do not alter an already selected queue. Retry reloads the selected source from the beginning. Actual playing state comes from media events; pending or rejected promises are not reported as successful playback.

## Project structure

```text
musicPlayer_App/
├── musicPlus/       React, TypeScript, Vite, Tailwind CSS
├── server/          Express and Mongoose API foundation
└── package.json     Convenience scripts (not an npm workspace)
```

## Requirements

- Node.js 20.19+ or 22.12+ (validated on Node.js 22.14.0)
- npm
- Clerk application credentials
- Last.fm API key
- Jamendo client ID
- MongoDB connection string (optional during frontend development)

## Setup

Install from the committed lockfiles, starting at the repository root:

```bash
npm ci
npm --prefix musicPlus ci
npm --prefix server ci
```

The root package has no dependencies; its minimal lockfile supports a consistent root `npm ci`. Client and server installations are separate. No `--legacy-peer-deps` flag is required.

Create local environment files from the examples only if they do not already exist, then replace the example values. Preserve existing local credentials:

```powershell
if (!(Test-Path musicPlus\.env)) { Copy-Item musicPlus\.env.example musicPlus\.env }
if (!(Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
```

Run the client and server in separate terminals from the repository root:

```bash
npm run dev:client
npm run dev:server
```

The client uses Vite's displayed local URL. The API defaults to `http://localhost:4000`, with health available at `GET /health`.

## Quality checks

```bash
npm run lint
npm run build
```

Run the existing mocked regression suite and TypeScript checks from the repository root:

```bash
npm --prefix musicPlus test
npm --prefix musicPlus run typecheck
```

The regression tests cover provider validation, URL search clearing/races/retry/history, Clerk authentication/session requirements, playback lifecycle, adapters, source IDs, queue selection/boundaries, media errors, and route/search continuity using mocks. They do not verify live authentication or use a production database. Tests disable Vite environment-file loading. No real .env files are required for lint, TypeScript, or an env-free production build. Root lint/build commands cover the frontend only; the server has no automated test suite and its test script is still a failing placeholder. Browser end-to-end automation remains future work.

## Authentication limitations (Phase 1B)

The custom forms support password sign-in, email-code sign-up verification, and email-code password reset. A completed attempt is not sufficient for navigation: the forms await Clerk session activation and inspect the actual session. They navigate to the usual destination only when the session is active and has no `currentTask`.

MFA challenges, additional first-factor verification, and sign-up requirements beyond the existing email-code flow are not implemented in these forms. Incomplete attempts display an accessible alert and do not activate a session. Required session tasks, including MFA setup, organization selection, and session password reset, also have no completion UI here. They keep the user on the authentication form with an alert directing them to contact the application administrator for a supported authentication flow. This guidance does not imply that such a flow is already configured; affected accounts cannot finish authentication through these custom forms until one is provided.

The ordinary forgot-password form is not a replacement for a required session password-reset task. A pending session is not treated as fully authenticated. No MFA, email verification, session task, or Clerk dashboard requirement is disabled or marked complete by the app. Clerk continues to enforce its requirements; any protected server operation must also enforce authentication server-side.

Reference: [Clerk session tasks](https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks) and [legacy password-reset flow](https://clerk.com/docs/guides/development/custom-flows/authentication/legacy/forgot-password). The implementation uses the installed `@clerk/clerk-react` 5.61.6 API, not the newer `finalize()` API.

## Environment variables

Client variables are documented in `musicPlus/.env.example`:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_LASTFM_API_KEY`
- `VITE_BASE_URL`
- `VITE_JAMENDO_API_URL`
- `VITE_JAMENDO_CLIENT_ID`

Server variables are documented in `server/.env.example`:

- `PORT`
- `DATABASE_URL`

Never commit real credentials. Both local `.env` files are ignored by Git.

## Portfolio roadmap

1. Add seek, volume, shuffle, repeat, and queue editing controls.
2. Build authenticated MongoDB playlists, favorites, and listening history.
3. Extend existing component tests with API integration and browser end-to-end coverage.
4. Deploy the client and API and add screenshots, architecture notes, and a demo video.

Only deploy audio that you have permission to redistribute. Last.fm should be treated as a metadata source; playback must follow the selected provider's licensing terms.
