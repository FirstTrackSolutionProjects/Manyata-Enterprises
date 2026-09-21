// manyata-backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

// Import routes
// const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
// const rideRoutes = require('./routes/rideRoutes');

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_ride', (rideId) => {
    socket.join(`ride_${rideId}`);
    console.log(`Socket ${socket.id} joined ride room: ride_${rideId}`);
  });

  socket.on('join_drivers', () => {
    socket.join('drivers_room');
    console.log(`Socket ${socket.id} joined drivers_room`);
  });

  socket.on('update_location', (data) => {
    io.to(`ride_${data.rideId}`).emit(`location_${data.rideId}`, data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io to the app
app.set('socketio', io);

// Register API routes
// app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
// app.use('/api/rides', rideRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('CabIndia Backend API is running!');
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/`);
  console.log(`Auth routes available at: http://localhost:${PORT}/api/auth`);
});