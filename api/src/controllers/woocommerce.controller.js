const wooCommerceService = require('../services/woocommerce.service');

// @desc    Fetch all WooCommerce orders with pagination, search, and date filtering
// @route   GET /api/woocommerce/orders
// @access  Private (Requires Permission)
exports.fetchAllOrders = async (req, res) => {
    try {
        // --- PERMISSION CHECK ---
        if (req.user.role !== 'admin' && !req.user.permissions.canViewWooCommerceOrders) {
            return res.status(403).json({ message: 'شما مجوز مشاهده سفارشات را ندارید.' });
        }
        // ------------------------

        const { page = 1, per_page = 10, search, after, before } = req.query;
        const params = { page, per_page };
        if (search) params.search = search;
        if (after) params.after = after;
        if (before) params.before = before;

        const data = await wooCommerceService.getOrders(params);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch a single WooCommerce order by ID with customer details
// @route   GET /api/woocommerce/orders/:id
// @access  Private (Requires Permission)
exports.fetchOrderDetails = async (req, res) => {
    try {
        // --- PERMISSION CHECK ---
        if (req.user.role !== 'admin' && !req.user.permissions.canViewWooCommerceOrders) {
            return res.status(403).json({ message: 'شما مجوز مشاهده جزئیات سفارش را ندارید.' });
        }
        // ------------------------

        const order = await wooCommerceService.getOrderById(req.params.id);

        if (order && order.customer_id > 0) {
            const customer = await wooCommerceService.getCustomerById(order.customer_id);
            if (customer) {
                order.customer_username = customer.username;
            }
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};