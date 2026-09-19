# MusicPlus

MusicPlus is a full-stack music discovery and player project. The React client combines a local demo playlist with Last.fm discovery data and Jamendo search. Clerk provides authentication, while the Express server supplies a health endpoint and an optional MongoDB connection. No playlist API is implemented.

## Current features

- Responsive desktop and mobile application shell
- Clerk sign-up, email verification, sign-in, and password reset
- Shared local/Jamendo playback with track selection, next/previous, progress, and an editable Up Next plan
- Last.fm global top artists, tracks, tags, and artist albums
- URL-driven Jamendo catalog search with loading, empty, and error states
- Global discovery charts shown after sign-in
- Express health endpoint with optional MongoDB connectivity

Demo mix cards are display-only. The demo-playlist section is not listening history. Songs and playable Jamendo search results start their own ordered playback queues. Last.fm discovery remains metadata-only. Saved playlists, favorites, listening history, and drag-and-drop queue editing remain future work.

## Up Next and basic queue actions (Phase 4A)

Open Up Next inline in the full player, or follow the mini player's Up Next link to the in-page queue view. Both show the current track and upcoming playback order; the mini player stays compact so it cannot cover queue actions. Songs and playable Jamendo search results offer Play Next and Add to Queue. Unavailable Jamendo results and Last.fm metadata cannot be queued. These actions retain the single audio element, selected source, playback position, and playing/paused intent. Search changes and route navigation do not change the edited queue. Selecting Play on a song deliberately replaces the queue with that song's catalog or current search results.

Play Next puts a new track first in the upcoming plan. If that track is already upcoming, it moves its first upcoming occurrence to the front and does not create another. Add to Queue puts a new track after the existing upcoming plan; selecting a track already upcoming leaves its position unchanged. The current track and tracks absent from the current Up Next plan because they have already played cannot be queued again through these actions; the UI announces why. An action on an empty queue selects the track paused, ready for an explicit Play. Source-prefixed IDs identify tracks, and copied queue entries keep Jamendo attribution and license URLs.

Natural completion and manual Next both consume Play Next entries before the remaining queue. Repeat one replays the current track on natural completion, leaving Up Next untouched; manual Next still advances. With repeat off, natural completion stops after the current plan, while manual Next wraps to the start as it did before this phase. Repeat all starts another full cycle after the plan. With shuffle on, Play Next remains first and Add to Queue goes after the remaining shuffled cycle. A shuffle toggle starts a new traversal from the current track; explicitly promoted tracks stay ahead of the reshuffled remainder. At a cycle boundary, a new shuffle order avoids an immediate repeat when another track exists.

Previous restarts the current track after two seconds as before. Otherwise it retraces playback history; at the oldest history entry, shuffle stays there and ordinary order wraps to the preceding queue track. Next retraces forward history before unvisited entries. A queue edit after going backward makes those forward-history entries part of the upcoming plan: Play Next goes before them, Add to Queue goes after them and the remaining plan. No intended forward entry is silently removed. The queue is session-only; this phase has no remove, reorder, playlist, or persistence feature.

## Up Next editing (Phase 4B)

Each upcoming row has Remove, Move Up, and Move Down buttons. Boundary moves are disabled. These buttons target a queue slot, so two entries with the same source-prefixed ID remain distinct; removing one leaves the other. The current track has no edit buttons. Edits leave the audio source, progress, volume, and playing/paused state alone, and the visible Up Next order is the order used by manual Next and natural completion.

Remove excludes that slot from the remaining cycle and later repeat-all cycles. Its existing playback-history record is retained; Previous can still retrace an already-played entry. Play Next or Add to Queue can restore an explicitly removed track, at the front or end of Up Next. Moving a row changes only its place in the remaining plan. Play Next still takes the first position, while Add to Queue follows all remaining entries. After Previous, an edit converts the forward route into the editable plan while preserving the history already traversed; the edited future is what Next follows.

Repeat one still replays the current track on natural completion; manual Next follows edited Up Next. Repeat off stops at the end on natural completion, while a manual Next starts another cycle using only retained slots. Repeat all starts another cycle using only retained slots. Shuffle sets the initial unedited order; after an explicit edit, the displayed remaining plan stays fixed through a shuffle toggle, and a later cycle can shuffle retained slots again. Removed slots stay excluded, including when Previous wraps from the oldest history entry. A new Play selection replaces the edited queue and resets these edits. Empty and one-track queues show no editable rows. There is no drag-and-drop or saved queue.

## Playback behavior (Phase 2)

One provider above the routes owns one audio element, the selected track, an immutable queue snapshot, media state, progress, loading, and fixed public errors. Local and Jamendo adapters use `local:` and `jamendo:` IDs; Last.fm records are never adapted to audio. Supplied Jamendo attribution and Creative Commons license links remain available in search and player views.

Only the page-load default stays paused: page load never starts audio. Explicit Play starts the selected track, including a track selected with Next/Previous while paused. Selecting a local row starts the local catalog at that row. Selecting a search result starts the current playable results in their displayed order; missing or unsafe stream URLs are labelled unavailable and excluded from that queue. Jamendo playback uses the documented `audio` stream, never `audiodownload`: [official tracks contract](https://developer.jamendo.com/v3.0/tracks).

Manual Next wraps at the traversal boundary. Previous restarts the current track after two seconds; otherwise it moves backward and wraps at the beginning when shuffle is off. These controls preserve playing/paused intent. By default, natural completion advances exactly once within the queue and stops on the final track. Play can restart a completed final track.

`playTrack(track)` starts a singleton queue. `playQueue(tracks, startIndex)` copies its input before selection. Empty input clears playback; an invalid index or unavailable audio is rejected safely without replacing the current queue. Search changes, clearing, and navigation do not alter an already selected queue. Retry reloads the selected source from the beginning. Actual playing state comes from media events; pending or rejected promises are not reported as successful playback.

## Repeat and shuffle (Phase 3B)

Both players share repeat off/all/one and shuffle on/off controls. Defaults are off, with no persistence. Toggling either mode does not change the track, timing, volume, or playing/paused intent, and does not start playback. Repeat off advances naturally and stops at the traversal end; all wraps; one replays the current track. Manual Next ignores repeat-one and wraps; Previous retains its two-second restart behavior.

Shuffle leaves the original queue unchanged and builds a permutation anchored on the current track. Each forward cycle visits every queue entry once. Previous follows visited traversal history (and stays on the current track at the oldest entry); Next retraces forward history before consuming another slot. Deliberately revisiting a track with Previous is not a new shuffle slot. Toggling shuffle starts a new traversal cycle, retains past navigation, and discards forward history. Turning it off restores original queue order from the current track.

Manual wrapping and repeat-all completion create a fresh shuffled cycle, avoiding an immediate repeat of the boundary track when another track exists. Queue replacement retains the modes but resets traversal and history around the explicitly selected track. Empty queues do nothing; one-track queues stop naturally with repeat off and replay with all/one. Their manual Next selects the same track because no alternative exists. Navigation history is temporary player state, not a listening-history feature. Media failures stop playback and keep the existing safe retry feedback; they do not trigger repeat.

## Seek and volume (Phase 3A)

Full and mini players control the same audio element through the provider. Seeking is disabled until the element reports a positive finite duration and usable seekable ranges. Targets clamp to the duration and nearest currently seekable range, including gaps; nonfinite inputs are ignored. No seek is queued while loading. Track selection invalidates old seek callbacks, and displayed progress comes from current media events rather than an optimistic slider position. Seeking preserves playing/paused intent.

Volume clamps to 0–1. Mute retains the previous nonzero level, and Unmute restores it; moving the volume slider above zero also unmutes. Both views follow actual element properties and `volumechange`. Volume stays shared across route and track changes, but nothing is persisted across page loads. Native range controls support arrow keys, Home/End, and visible keyboard focus.

Some browsers/platforms control volume through the device instead of the media element. Rejected or ignored property changes show safe guidance and retain the reported element state. A successful property readback cannot prove the audible hardware level. Use device controls when needed. Seeking support and available ranges depend on the audio server and browser. Reference: [HTML media seeking](https://html.spec.whatwg.org/multipage/media.html#seeking) and [volume](https://html.spec.whatwg.org/multipage/media.html#dom-media-volume).

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

1. Build authenticated MongoDB playlists, favorites, and listening history.
2. Add drag-and-drop queue editing if it improves the keyboard-accessible controls.
3. Extend existing component tests with API integration and browser end-to-end coverage.
4. Deploy the client and API and add screenshots, architecture notes, and a demo video.

Only deploy audio that you have permission to redistribute. Last.fm should be treated as a metadata source; playback must follow the selected provider's licensing terms.
