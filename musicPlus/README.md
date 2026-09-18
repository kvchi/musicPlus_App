# MusicPlus client

The frontend setup, environment variables, scripts, and roadmap are documented in the repository-level [`README.md`](../README.md).

From this directory, install reproducibly with `npm ci`, then use:

```bash
npm run dev
npm run lint
npm test
npm run typecheck
npm run build
npm run preview
```

The custom authentication forms cannot complete MFA challenges or required session tasks. They display guidance and withhold normal authenticated navigation; see [authentication limitations](../README.md#authentication-limitations-phase-1b). The existing 65 regression tests use mocks, not live Clerk accounts or provider credentials, and disable environment-file loading. Search-result playback, queue controls, playlists, and listening history are not implemented.
