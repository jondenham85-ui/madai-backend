const express = require("express");
const { getUsers, getDirectives, getSystemSummary } = require("../controllers/adminController");

const router = express.Router();

router.get("/users", getUsers);
router.get("/directives", getDirectives);
router.get("/system", getSystemSummary);

module.exports = router;
