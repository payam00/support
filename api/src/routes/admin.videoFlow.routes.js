const express = require('express');
const router = express.Router();
const {
    getAllFlows,
    createFlow,
    updateFlow,
    deleteFlow
} = require('../controllers/admin.videoFlow.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Protect all routes in this file, only admins can access
router.use(protect, authorize('admin'));

router.route('/')
    .get(getAllFlows)
    .post(createFlow);

router.route('/:id')
    .put(updateFlow)
    .delete(deleteFlow);

module.exports = router;