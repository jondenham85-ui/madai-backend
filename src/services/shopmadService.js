const mockProducts = [
  { id: "prod_1", name: "MADSI Starter Pack", price: 49, category: "software" },
  { id: "prod_2", name: "Family Workflow AI", price: 129, category: "ai" },
  { id: "prod_3", name: "Revenue Dashboard", price: 79, category: "analytics" },
];

const mockOrders = [
  { id: "ord_1", customer: "Jordan", total: 49, status: "paid" },
  { id: "ord_2", customer: "Michaela", total: 129, status: "pending" },
  { id: "ord_3", customer: "Alex", total: 79, status: "complete" },
];

async function getProducts() {
  return mockProducts;
}

async function getOrders() {
  return mockOrders;
}

module.exports = {
  getProducts,
  getOrders,
};
