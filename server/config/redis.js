import chalk from "chalk";
import { createClient } from "redis";

let redisClient;

const connectToRedis = async () => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("connect", () => {
    console.log(chalk.greenBright("✅ Connected to Redis server"));
  });

  redisClient.on("error", (error) => {
    console.error(chalk.redBright("❌ Redis Client Error:"), error.message);
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error(chalk.redBright("❌ Failed to connect to Redis:"), error.message);
    process.exit(1);
  }
};

export default connectToRedis;
