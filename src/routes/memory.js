const express = require("express");
const {
  listMemories,
  createMemory,
  deleteMemory,
} = require("../controllers/memoryController");
const { memoryValidator } = require("../validators/memoryValidator");

const router = express.Router();

router.get("/", listMemories);
router.post("/", memoryValidator, createMemory);
router.delete("/:id", deleteMemory);

module.exports = router;
