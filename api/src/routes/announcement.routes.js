const express = require('express');
const router = express.Router();
const { 
    getAnnouncements, 
    getActiveAnnouncements, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Route for all users to see active announcements on their dashboard
router.route('/active').get(protect, getActiveAnnouncements);

// Routes for admins to manage announcements
router.use(protect, authorize('admin'));
router.route('/')
    .get(getAnnouncements)
    .post(createAnnouncement);

router.route('/:id')
    .put(updateAnnouncement)
    .delete(deleteAnnouncement);

module.exports = router;