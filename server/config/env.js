const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

function getConfig() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || !mongoUri.trim()) {
    throw new Error("MONGO_URI is required. Set it in server/.env or the environment.");
  }

  const rawPort = process.env.PORT || "5001";
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  let parsedOrigin;
  try {
    parsedOrigin = new URL(clientOrigin);
  } catch {
    throw new Error("CLIENT_ORIGIN must be a valid HTTP or HTTPS origin.");
  }
  if (
    !["http:", "https:"].includes(parsedOrigin.protocol) ||
    parsedOrigin.origin !== clientOrigin
  ) {
    throw new Error("CLIENT_ORIGIN must be a valid HTTP or HTTPS origin without a path.");
  }

  return { mongoUri, port, clientOrigin };
}

module.exports = { getConfig };
