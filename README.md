# Music Player

The React frontend provides music playback and discovery using Clerk, Jamendo,
and Last.fm. The Express server currently exposes only `GET /health`.

MongoDB remains available to the server for potential future playlist
persistence. The server starts without it when `DATABASE_URL` is not configured
or the connection cannot be established.

Image uploads are intentionally not exposed. Authenticated uploads may be
implemented later as a separate feature with explicit authorization and upload
controls.
