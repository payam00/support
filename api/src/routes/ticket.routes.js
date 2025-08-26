const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getTicketById,
    addMessage,
    updateTicketStatus, // <-- اطمینان از ایمپورت صحیح
    getTicketSummary,
    getTicketSuggestions,
    assignTicket,
    referTicket,
    escalateToHuman,
    resolveByAi
} = require('../controllers/ticket.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect);

router.route('/').post(createTicket).get(getTickets);
router.route('/:id').get(getTicketById);
router.route('/:id/messages').post(upload.single('voice'), addMessage);

const staffRoles = ['operator', 'department_head', 'admin'];

// این مسیر اکنون باید به درستی کار کند
router.route('/:id/status').put(authorize(...staffRoles), updateTicketStatus);

router.route('/:id/summary').get(authorize(...staffRoles), getTicketSummary);
router.route('/:id/suggestions').get(authorize(...staffRoles), getTicketSuggestions);
router.route('/:id/assign').put(authorize(...staffRoles), assignTicket);
router.route('/:id/refer').post(authorize(...staffRoles), referTicket);
router.route('/:id/escalate').post(escalateToHuman);
router.route('/:id/resolve-ai').post(resolveByAi);

module.exports = router;