const express = require("express");
const { handlePrompt } = require("../controllers/synthController");

const router = express.Router();

router.post("/", handlePrompt);

module.exports = router;
