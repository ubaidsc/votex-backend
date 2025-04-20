const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});