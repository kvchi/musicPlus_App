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

The custom authentication forms cannot complete MFA challenges or required session tasks. They display guidance and withhold normal authenticated navigation; see [authentication limitations](../README.md#authentication-limitations-phase-1b). Regression tests use mocks, not live Clerk accounts or provider credentials, and disable environment-file loading. Shared local/Jamendo queue playback is documented in [playback behavior](../README.md#playback-behavior-phase-2), shared seek/volume controls in [Phase 3A behavior](../README.md#seek-and-volume-phase-3a), repeat/shuffle traversal in [Phase 3B behavior](../README.md#repeat-and-shuffle-phase-3b), Up Next actions in [Phase 4A behavior](../README.md#up-next-and-basic-queue-actions-phase-4a), and editing in [Phase 4B behavior](../README.md#up-next-editing-phase-4b). Drag-and-drop, playlists, and listening history are not implemented.
