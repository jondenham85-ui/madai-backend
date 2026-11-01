const express = require("express");
const { authLimiter } = require("../middleware/rateLimit");
const { signup, login, logout, me } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../validators/authValidator");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(authLimiter);

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

module.exports = router;
