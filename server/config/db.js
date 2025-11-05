// Importing 'chalk' library to style console logs with colors
import chalk from "chalk";

// Importing 'mongoose' library to interact with MongoDB
import mongoose from "mongoose";

// Function that connects our app to the MongoDB database
const connectToDatabase = async () => {
  // 'mongoose.connect()' tries to connect using the DATABASE_URL
  // from our environment variables (.env file)
  const dbConnected = await mongoose.connect(process.env.DATABASE_URL);

  // If connection is successful, log a green success message
  if (dbConnected) {
    console.log(chalk.bgGreenBright("Database connected successfully"));
  } 
  // If connection fails, log a red error message
  else {
    console.log(chalk.bgRedBright("Database connection failed"));
  }
}

// Export the function so it can be used in other files
export default connectToDatabase;
