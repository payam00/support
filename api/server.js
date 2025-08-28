const dotenv = require('dotenv');
dotenv.config({ debug: true });

const app = require('./app');
const connectDB = require('./src/config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});