const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
    getDiscounts,
    createDiscount,
    createBulkDiscounts,
    bulkUpdateDiscounts // <-- Import new function
} = require('../controllers/discount.controller');

router.use(protect, authorize('admin'));

router.route('/')
    .get(getDiscounts)
    .post(createDiscount);

router.route('/bulk')
    .post(createBulkDiscounts);

// --- NEW ROUTE for bulk actions ---
router.route('/bulk-actions')
    .post(bulkUpdateDiscounts);

module.exports = router;