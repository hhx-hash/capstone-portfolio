const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");

/**
 * Entry point: connect to Atlas, then start listening.
 *
 * The database is connected *before* the port opens, so a request never arrives
 * at an app with no connection. If Atlas is unreachable the process exits with
 * a non-zero code, which is what Render uses to mark a deploy as failed.
 */
async function start() {
  try {
    await connectDB();

    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
      console.log(`[api] allowed client origins: ${env.clientOrigins.join(", ")}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[api] ${signal} received, shutting down`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error(`[api] startup failed: ${error.message}`);
    process.exit(1);
  }
}

start();
