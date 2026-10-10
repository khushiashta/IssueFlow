const cors = require("cors");
const express = require("express");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

function createApp({ clientOrigin, jwtSecret }) {
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
  app.use("/api/auth", authRoutes({ jwtSecret }));
  app.use("/api/projects", projectRoutes({ jwtSecret }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
