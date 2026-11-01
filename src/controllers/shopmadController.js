const shopmadService = require("../services/shopmadService");

async function getProducts(req, res, next) {
  try {
    const products = await shopmadService.getProducts();
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await shopmadService.getOrders();
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getOrders,
};
