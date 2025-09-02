// --- FIX: Load environment variables at the very beginning ---
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
// -----------------------------------------------------------

const connectDB = require('./src/config/db');
const app = require('./app');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);
const { startTicketCloserJob } = require('./src/services/cron.service');
startTicketCloserJob(); 
// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});