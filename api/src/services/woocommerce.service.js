const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const wooCommerceApi = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_KEY,
  consumerSecret: process.env.WOOCOMMERCE_SECRET,
  version: "wc/v3"
});

/**
 * Fetches orders from WooCommerce with pagination and search.
 */
const getOrders = async (params = {}) => {
  try {
    const response = await wooCommerceApi.get("orders", params);
    const totalOrders = response.headers['x-wp-total'];
    const totalPages = response.headers['x-wp-totalpages'];
    return {
      orders: response.data,
      total: parseInt(totalOrders, 10),
      pages: parseInt(totalPages, 10),
    };
  } catch (error) {
    console.error("WooCommerce API Error:", error.response?.data);
    throw new Error("Failed to fetch orders from WooCommerce.");
  }
};

/**
 * Fetches a single order by its ID from WooCommerce.
 */
const getOrderById = async (orderId) => {
  try {
    const response = await wooCommerceApi.get(`orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`WooCommerce API Error for order ${orderId}:`, error.response?.data);
    throw new Error("Failed to fetch order details from WooCommerce.");
  }
};

/**
 * --- NEW FUNCTION ---
 * Fetches a single customer by their ID from WooCommerce.
 * @param {number} customerId - The ID of the customer.
 * @returns {Promise<object|null>} - The customer data or null if not found.
 */
const getCustomerById = async (customerId) => {
  try {
    const response = await wooCommerceApi.get(`customers/${customerId}`);
    return response.data;
  } catch (error) {
    // If customer not found or another error, log it but don't crash the process
    console.error(`WooCommerce API Error for customer ${customerId}:`, error.response?.data);
    return null;
  }
};

module.exports = { getOrders, getOrderById, getCustomerById }; // Export the new function