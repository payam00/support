const express = require('express');
const router = express.Router();
const {
    createDepartment,
    updateDepartment,
    getAllDepartments,
    addOperatorToDepartment,
    removeOperatorFromDepartment,
    getMyDepartment,
    addFaq,
    getFaqs,
    updateFaq,      // <-- اطمینان از وجود این تابع
    deleteFaq,      // <-- اطمینان از وجود این تابع
    deleteDepartment
} = require('../controllers/department.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// GET route for department heads to find their own department
router.get('/my-department', protect, authorize('department_head', 'admin'), getMyDepartment);

// Admin Only Routes for managing departments
router.route('/')
    .post(protect, authorize('admin'), createDepartment)
    .get(protect, getAllDepartments);

router.route('/:id')
    .put(protect, authorize('admin'), updateDepartment)
    .delete(protect, authorize('admin'), deleteDepartment);

// Department Head Only Routes for managing operators
router.route('/:id/operators')
    .post(protect, authorize('department_head', 'admin'), addOperatorToDepartment);

router.route('/:id/operators/:operatorId')
    .delete(protect, authorize('department_head', 'admin'), removeOperatorFromDepartment);

// Routes for managing FAQs (Admin and Dept Head)
router.route('/:id/faqs')
    .post(protect, authorize('admin', 'department_head'), addFaq)
    .get(protect, getFaqs);

// این مسیرها اکنون باید به درستی کار کنند
router.route('/:id/faqs/:faqId')
    .put(protect, authorize('admin', 'department_head'), updateFaq)
    .delete(protect, authorize('admin', 'department_head'), deleteFaq);

module.exports = router;