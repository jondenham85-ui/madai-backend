const express = require("express");
const { getProducts, getOrders } = require("../controllers/shopmadController");

const router = express.Router();

router.get("/products", getProducts);
router.get("/orders", getOrders);

module.exports = router;
