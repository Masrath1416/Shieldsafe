const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/journey', require('./routes/journeyRoutes'));
app.use('/api/timer', require('./routes/timerRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('Women Safety API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
