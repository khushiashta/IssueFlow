const jwt = require("jsonwebtoken");

function requireAuth(jwtSecret) {
  return function authenticate(req, res, next) {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const payload = jwt.verify(match[1], jwtSecret);
      if (typeof payload.sub !== "string" || !payload.sub) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      req.authUserId = payload.sub;
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

module.exports = requireAuth;
