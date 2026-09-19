import chalk from "chalk";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "node:url";

import connectToDatabase from "./config/db.js";
import { playlistsRouter } from "./routes/playlists.js";

export function createApp({ authMiddleware, ownerFromRequest, isDatabaseReady, model, clerkAuth } = {}) {
  const app = express();
  app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
  const configured = Boolean(clerkAuth && process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  if (clerkAuth && !configured) throw new Error("Clerk server keys are not configured.");
  const auth = authMiddleware ?? (configured ? clerkAuth.clerkMiddleware({
    authorizedParties: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }) : (_request, _response, next) => next());
  app.use("/api/playlists", auth, express.json({ limit: "8kb" }), playlistsRouter({ model, isDatabaseReady,
    ownerFromRequest: ownerFromRequest ?? (request => {
      if (!configured) return null;
      const identity = clerkAuth.getAuth(request);
      return identity.isAuthenticated ? identity.userId : null;
    }),
  }));
  app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.status === 413) return response.status(413).json({ error: "Request is too large." });
    if (error instanceof SyntaxError && error.status === 400) return response.status(400).json({ error: "Invalid JSON." });
    response.status(503).json({ error: "Saved playlists are temporarily unavailable." });
  });
  return app;
}

export const app = createApp();
export const startServer = (application = app) => {
  const port = process.env.PORT || 4000;
  const server = application.listen(port, () => {
    console.log(chalk.greenBright(`Server listening on port ${port}.`));
  });

  void connectToDatabase();

  server.on("error", () => {
    console.error(chalk.redBright("Server failed to start."));
    process.exitCode = 1;
  });

  return server;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)), quiet: true });
  const clerkAuth = await import("@clerk/express");
  startServer(createApp({ clerkAuth }));
}
