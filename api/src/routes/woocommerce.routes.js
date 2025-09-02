const express = require('express');
const router = express.Router();
const { fetchAllOrders, fetchOrderDetails } = require('../controllers/woocommerce.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const staffRoles = ['operator', 'department_head', 'admin'];

// Protect all routes in this file
router.use(protect, authorize(...staffRoles));

router.route('/orders').get(fetchAllOrders);
router.route('/orders/:id').get(fetchOrderDetails);

module.exports = router;