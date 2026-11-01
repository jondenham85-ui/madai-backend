const express = require("express");
const { processPrompt } = require("../controllers/synthController");
const { synthValidator } = require("../validators/synthValidator");

const router = express.Router();

router.post("/", synthValidator, processPrompt);

module.exports = router;
