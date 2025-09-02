const express = require('express');
const router = express.Router();
const { getRootFlow, getFlowById } = require('../controllers/videoFlow.controller.js');

// این مسیرها عمومی هستند و نیاز به احراز هویت ندارند،
// زیرا ویجت قبل از لاگین کاربر باید نمایش داده شود.

// Route to get the starting video flow
router.get('/root', getRootFlow);

// Route to get a specific flow by its ID
router.get('/:id', getFlowById);


module.exports = router;