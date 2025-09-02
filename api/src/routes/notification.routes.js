const express = require('express');
const router = express.Router();
const { subscribe, getVapidKey } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/subscribe', subscribe);
router.get('/vapid-key', getVapidKey);

module.exports = router;