const cors = require("cors");
const express = require("express");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const healthRoutes = require("./routes/healthRoutes");

function createApp({ clientOrigin }) {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || origin === clientOrigin);
      },
    }),
  );
  app.use(express.json({ limit: "10kb" }));

  app.use("/", healthRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
