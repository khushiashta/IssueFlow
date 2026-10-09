const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function validEmail(email) {
  return typeof email === "string" && emailPattern.test(email.trim());
}

function tokenFor(user, jwtSecret) {
  return jwt.sign({}, jwtSecret, { subject: user.id, expiresIn: "7d" });
}

function createAuthController({ jwtSecret }) {
  async function register(req, res) {
    const { name, email, password } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      !validEmail(email) ||
      typeof password !== "string" ||
      Array.from(password).length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({ message: "Name, valid email, and password (8 or more characters, at most 72 UTF-8 bytes) are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12) });
      return res.status(201).json({ token: tokenFor(user, jwtSecret), user: safeProfile(user) });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      throw error;
    }
  }

  async function login(req, res) {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Valid email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json({ token: tokenFor(user, jwtSecret), user: safeProfile(user) });
  }

  async function me(req, res) {
    const user = await User.findById(req.authUserId);
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    return res.json({ user: safeProfile(user) });
  }

  return { register, login, me };
}

module.exports = createAuthController;
