const createApp = require("./app");
const { getConfig } = require("./config/env");
const connectDB = require("./config/db");

async function startServer() {
  const config = getConfig();

  await connectDB(config.mongoUri);

  const app = createApp({ clientOrigin: config.clientOrigin });
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
