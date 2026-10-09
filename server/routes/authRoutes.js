const express = require("express");

const createAuthController = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");

function authRoutes({ jwtSecret }) {
  const router = express.Router();
  const controller = createAuthController({ jwtSecret });

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/me", requireAuth(jwtSecret), controller.me);

  return router;
}

module.exports = authRoutes;
