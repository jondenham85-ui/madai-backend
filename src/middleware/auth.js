const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.madai_session ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired session" });
  }
}

module.exports = requireAuth;
