const mongoose = require("mongoose");

const Project = require("../models/Project");

const allowedFields = new Set(["name", "description"]);

function validateFields(body, { requireName = false, requireField = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be an object";
  }

  const keys = Object.keys(body);
  if (keys.some((key) => !allowedFields.has(key))) {
    return "Only name and description are allowed";
  }
  if (requireField && keys.length === 0) {
    return "At least one of name or description is required";
  }
  if (requireName && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120)) {
    return "Name is required and must be at most 120 characters";
  }
  if (Object.hasOwn(body, "name") && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120)) {
    return "Name must be a non-empty string of at most 120 characters";
  }
  if (Object.hasOwn(body, "description") && (typeof body.description !== "string" || body.description.trim().length > 2000)) {
    return "Description must be a string of at most 2000 characters";
  }
  return null;
}

function validId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

function createProjectController() {
  async function create(req, res) {
    const validationError = validateFields(req.body, { requireName: true });
    if (validationError) return res.status(400).json({ message: validationError });

    const project = await Project.create({
      name: req.body.name,
      ...(Object.hasOwn(req.body, "description") ? { description: req.body.description } : {}),
      owner: req.authUserId,
    });
    return res.status(201).json({ project });
  }

  async function list(req, res) {
    const projects = await Project.find({ owner: req.authUserId }).sort({ createdAt: -1 });
    return res.json({ projects });
  }

  async function get(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid project ID" });
    const project = await Project.findOne({ _id: req.params.id, owner: req.authUserId });
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ project });
  }

  async function update(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid project ID" });
    const validationError = validateFields(req.body, { requireField: true });
    if (validationError) return res.status(400).json({ message: validationError });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.authUserId },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ project });
  }

  async function remove(req, res) {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid project ID" });
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.authUserId });
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ message: "Project deleted" });
  }

  return { create, list, get, update, remove };
}

module.exports = createProjectController;
