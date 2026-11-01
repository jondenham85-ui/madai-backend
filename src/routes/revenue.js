const express = require("express");
const { listRevenue, createRevenue } = require("../controllers/revenueController");

const router = express.Router();

router.get("/", listRevenue);
router.post("/", createRevenue);

module.exports = router;
