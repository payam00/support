const express = require('express');
const { 
    addUser, 
    getAllUsers, 
    updateUser,
    getSettings, 
    updateSettings,
     resetGatewayCounters
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const router = express.Router();

// All routes in this file are protected and require admin role
router.use(protect, authorize('admin'));

// User management routes
router.route('/users')
    .get(getAllUsers)
    .post(addUser);

router.route('/users/:id')
    .put(updateUser);

// Settings routes
router.route('/settings')
    .get(getSettings) // <-- Add the GET route for settings
    .put(updateSettings);
router.post('/settings/reset-gateway', resetGatewayCounters);

module.exports = router;