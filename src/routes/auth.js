const express = require("express");
const { signup, login, logout, me } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../validators/authValidator");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);

module.exports = router;
