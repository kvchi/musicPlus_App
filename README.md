# Music Player

The React frontend provides music playback and discovery using Clerk, Jamendo,
and Last.fm. The Express server currently exposes only `GET /health`.

MongoDB remains available to the server for potential future playlist
persistence. The server starts without it when `DATABASE_URL` is not configured
or the connection cannot be established.

Image uploads are intentionally not exposed. Authenticated uploads may be
implemented later as a separate feature with explicit authorization and upload
controls.

## Authentication limitations (Phase 1B)

The custom forms support password sign-in, email-code sign-up verification, and email-code password reset. A completed attempt is not sufficient for navigation: the forms await Clerk session activation and inspect the actual session. They navigate to the usual destination only when the session is active and has no `currentTask`.

MFA challenges, additional first-factor verification, and sign-up requirements beyond the existing email-code flow are not implemented in these forms. Incomplete attempts display an accessible alert and do not activate a session. Required session tasks, including MFA setup, organization selection, and session password reset, also have no completion UI here. They keep the user on the authentication form with an alert directing them to contact the application administrator for a supported authentication flow. This guidance does not imply that such a flow is already configured; affected accounts cannot finish authentication through these custom forms until one is provided.

The ordinary forgot-password form is not a replacement for a required session password-reset task. A pending session is not treated as fully authenticated. No MFA, email verification, session task, or Clerk dashboard requirement is disabled or marked complete by the app. Clerk continues to enforce its requirements; any protected server operation must also enforce authentication server-side.

Reference: [Clerk session tasks](https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks) and [legacy password-reset flow](https://clerk.com/docs/guides/development/custom-flows/authentication/legacy/forgot-password). The implementation uses the installed `@clerk/clerk-react` 5.61.6 API, not the newer `finalize()` API.


## Phase 1B validation

Use Node.js 20.19+ or 22.12+ (validated on Node 22.14.0). From musicPlus, run ordinary `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Tests mock external services; live browser verification remains necessary. No real .env file is needed for these checks.
