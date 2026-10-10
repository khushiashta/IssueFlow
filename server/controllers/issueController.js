const mongoose = require("mongoose");

const Issue = require("../models/Issue");
const Project = require("../models/Project");

const allowedFields = new Set(["title", "description", "status", "priority"]);
const allowedStatuses = new Set(["open", "in-progress", "resolved", "closed"]);
const allowedPriorities = new Set(["low", "medium", "high"]);

function validateFields(body, { requireTitle = false, requireField = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be an object";
  }

  const keys = Object.keys(body);
  if (keys.some((key) => !allowedFields.has(key))) {
    return "Only title, description, status, and priority are allowed";
  }
  if (requireField && keys.length === 0) {
    return "At least one issue field is required";
  }
  if (requireTitle && !Object.hasOwn(body, "title")) {
    return "Title is required";
  }
  if (Object.hasOwn(body, "title") && (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 160)) {
    return "Title must be a non-empty string of at most 160 characters";
  }
  if (Object.hasOwn(body, "description") && (typeof body.description !== "string" || body.description.trim().length > 5000)) {
    return "Description must be a string of at most 5000 characters";
  }
  if (Object.hasOwn(body, "status") && !allowedStatuses.has(body.status)) {
    return "Status must be open, in-progress, resolved, or closed";
  }
  if (Object.hasOwn(body, "priority") && !allowedPriorities.has(body.priority)) {
    return "Priority must be low, medium, or high";
  }
  return null;
}

function validId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

function handleInvalidMongooseData(error, res) {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: error.message });
  }
  throw error;
}

function createIssueController() {
  async function accessibleProject(req, res) {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.authUserId });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return null;
    }
    return project;
  }

  async function create(req, res) {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: "Invalid project ID" });
    const validationError = validateFields(req.body, { requireTitle: true });
    if (validationError) return res.status(400).json({ message: validationError });

    try {
      const project = await accessibleProject(req, res);
      if (!project) return;
      const issue = await Issue.create({
        title: req.body.title,
        ...(Object.hasOwn(req.body, "description") ? { description: req.body.description } : {}),
        ...(Object.hasOwn(req.body, "status") ? { status: req.body.status } : {}),
        ...(Object.hasOwn(req.body, "priority") ? { priority: req.body.priority } : {}),
        project: project._id,
        createdBy: req.authUserId,
      });
      return res.status(201).json({ issue });
    } catch (error) {
      return handleInvalidMongooseData(error, res);
    }
  }

  async function list(req, res) {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: "Invalid project ID" });
    const project = await accessibleProject(req, res);
    if (!project) return;
    const issues = await Issue.find({ project: project._id }).sort({ createdAt: -1 });
    return res.json({ issues });
  }

  async function get(req, res) {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: "Invalid project ID" });
    if (!validId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue ID" });
    const project = await accessibleProject(req, res);
    if (!project) return;
    const issue = await Issue.findOne({ _id: req.params.issueId, project: project._id });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    return res.json({ issue });
  }

  async function update(req, res) {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: "Invalid project ID" });
    if (!validId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue ID" });
    const validationError = validateFields(req.body, { requireField: true });
    if (validationError) return res.status(400).json({ message: validationError });

    try {
      const project = await accessibleProject(req, res);
      if (!project) return;
      const issue = await Issue.findOneAndUpdate(
        { _id: req.params.issueId, project: project._id },
        { $set: req.body },
        { new: true, runValidators: true },
      );
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      return res.json({ issue });
    } catch (error) {
      return handleInvalidMongooseData(error, res);
    }
  }

  async function remove(req, res) {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: "Invalid project ID" });
    if (!validId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue ID" });
    const project = await accessibleProject(req, res);
    if (!project) return;
    const issue = await Issue.findOneAndDelete({ _id: req.params.issueId, project: project._id });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    return res.json({ message: "Issue deleted" });
  }

  return { create, list, get, update, remove };
}

module.exports = createIssueController;
