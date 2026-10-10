const express = require("express");

const createIssueController = require("../controllers/issueController");
const requireAuth = require("../middleware/requireAuth");

function issueRoutes({ jwtSecret }) {
  const router = express.Router();
  const controller = createIssueController();

  router.use(requireAuth(jwtSecret));
  router.post("/:projectId/issues", controller.create);
  router.get("/:projectId/issues", controller.list);
  router.get("/:projectId/issues/:issueId", controller.get);
  router.patch("/:projectId/issues/:issueId", controller.update);
  router.delete("/:projectId/issues/:issueId", controller.remove);

  return router;
}

module.exports = issueRoutes;
