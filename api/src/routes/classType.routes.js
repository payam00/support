const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const { getClassTypes, createClassType, updateClassType } = require('../controllers/classType.controller');

// Staff can view, only admin can modify
router.route('/')
    .get(protect, authorize('operator', 'department_head', 'admin'), getClassTypes)
    .post(protect, authorize('admin'), createClassType);

router.route('/:id')
    .put(protect, authorize('admin'), updateClassType);

module.exports = router;