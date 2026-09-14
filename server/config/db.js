import chalk from "chalk";
import mongoose from "mongoose";

const connectToDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    console.log(chalk.yellow("MongoDB disabled: missing DATABASE_URL."));
    return false;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(chalk.green("MongoDB connected."));
    return true;
  } catch {
    console.error(
      chalk.red("MongoDB connection failed; continuing without persistence.")
    );
    return false;
  }
};

export default connectToDatabase;
