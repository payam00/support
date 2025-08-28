const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Import Routes ---
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const departmentRoutes = require('./src/routes/department.routes');
const ticketRoutes = require('./src/routes/ticket.routes');
const videoFlowRoutes = require('./src/routes/videoFlow.routes');
const consultationRoutes = require('./src/routes/consultationRequest.routes');
const adminVideoFlowRoutes = require('./src/routes/admin.videoFlow.routes');
const statsRoutes = require('./src/routes/stats.routes');
const exportRoutes = require('./src/routes/export.routes');
const classTypeRoutes = require('./src/routes/classType.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const discountRoutes = require('./src/routes/discount.routes'); // <-- Import crucial
const paymentRoutes = require('./src/routes/payment.routes'); // <-- Import crucial
const woocommerceRoutes = require('./src/routes/woocommerce.routes');
const announcementRoutes = require('./src/routes/announcement.routes');

require('./src/models/setting.model');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.get('/', (req, res) => res.status(200).json({ message: 'Ticketing System API is running.' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/video-flows', videoFlowRoutes);
app.use('/api/consultation-requests', consultationRoutes);
app.use('/api/admin/video-flows', adminVideoFlowRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin/export', exportRoutes);
app.use('/api/classtypes', classTypeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/discounts', discountRoutes); 
app.use('/api/payment', paymentRoutes); 
app.use('/api/woocommerce', woocommerceRoutes);
app.use('/api/announcements', announcementRoutes);

module.exports = app;