const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected SUCCESSFULLY'))
  .catch((err) => console.error('!!! MONGODB CONNECTION ERROR:', err));

// === API ROUTES ===
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = { user: { id: user.id, email: user.email } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET, { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/rooms/create', (req, res) => {
  try {
    const roomId = uuidv4();
    res.status(201).json({ roomId });
  } catch (err) {
    console.error('CREATE ROOM ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

// === SOCKET.IO LOGIC ===
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  socket.on('drawing', ({ newLine, roomId }) => {
    socket.to(roomId).emit('drawing', newLine);
  });
  socket.on('code-change', ({ code, roomId }) => {
    socket.to(roomId).emit('code-change', code);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  socket.on('undo', ({ roomId }) => {
    // Broadcast to EVERYONE in the room (including the sender)
    io.in(roomId).emit('undo-line');
  });

  // When a 'clear-canvas' event is received
  socket.on('clear-canvas', ({ roomId }) => {
    // Broadcast to EVERYONE in the room
    io.in(roomId).emit('canvas-cleared');
  });
});

server.listen(PORT, () => console.log(`Server started successfully on port ${PORT}`));