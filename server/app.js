// Importing the required packages
import express from "express";           // Express framework to build our server
import dotenv from "dotenv";             // dotenv loads environment variables from .env file
import chalk from "chalk"; 
import router from   "./routes/images.js"  

const app = express();
// Setup middleware for cloudinary
app.use('/api', router);

// Importing our custom database & cache connection functions
import connectToDatabase from "./config/db.js";
import connectToRedis from "./config/redis.js";

// Load environment variables from the .env file into process.env
dotenv.config();

// Pull the server port from environment variables
const port = process.env.PORT;

// Create an instance of an Express application

// Function that starts the server
const startServer = async () => {
  try {
    // Step 1: Connect to the database (MongoDB)
    await connectToDatabase();

    // Step 2: Connect to Redis (cache store)
    await connectToRedis();

    // Step 3: Start the Express server only after connections succeed
    app.listen(port, () => {
      // Different logs styled with chalk to track server startup
      console.log(chalk.bgBlueBright("Initializing server..."));
      console.log(chalk.bgYellowBright("Server is ready to launch 🚀"));
      console.log(chalk.greenBright("Launch completed 🎉!"));
      console.log(
        chalk.whiteBright("Server is running on", `http://localhost:${port}`)
      );
    });
  } catch (err) {
    // If any error happens during startup (DB or Redis fails), log the error
    console.error(chalk.redBright("❌ Failed to start server:"), err.message);

    // Exit the process with a failure code so it doesn’t keep running
    process.exit(1);
  }
};

// Call the function to actually start the server
startServer();
