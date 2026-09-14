import chalk from "chalk";
import dotenv from "dotenv";
import express from "express";

import connectToDatabase from "./config/db.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 4000;

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(chalk.greenBright(`Server listening on port ${port}.`));
  });

  void connectToDatabase();

  server.on("error", () => {
    console.error(chalk.redBright("Server failed to start."));
    process.exitCode = 1;
  });

  return server;
};

startServer();

export { app, startServer };
