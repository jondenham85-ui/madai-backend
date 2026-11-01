const products = [
  { id: "prod_01", name: "MADSI Starter Pack", price: 49, category: "software" },
  { id: "prod_02", name: "Family Workflow AI", price: 129, category: "ai" },
  { id: "prod_03", name: "Revenue Dashboard", price: 79, category: "analytics" },
];

const orders = [
  { id: "ord_01", customer: "Jordan", total: 49, status: "paid" },
  { id: "ord_02", customer: "Michaela", total: 129, status: "pending" },
  { id: "ord_03", customer: "Alex", total: 79, status: "complete" },
];

async function getProducts() {
  return products;
}

async function getOrders() {
  return orders;
}

module.exports = {
  getProducts,
  getOrders,
};
