const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // Used for the Code Runner
require('dotenv').config();

const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS to allow frontend connection
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected SUCCESSFULLY'))
  .catch((err) => console.error('!!! MONGODB CONNECTION ERROR:', err));

// ==========================
//      API REST ROUTES
// ==========================

// 1. REGISTER USER
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

// 2. LOGIN USER
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
    // Include email in token payload for the Lobby greeting
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

// 3. CREATE ROOM
app.post('/api/rooms/create', (req, res) => {
  try {
    const roomId = uuidv4();
    res.status(201).json({ roomId });
  } catch (err) {
    console.error('CREATE ROOM ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

// 4. RUN CODE (Using Piston API)
app.post('/api/code/run', async (req, res) => {
  const { code, language } = req.body;

  // Map frontend language names to Piston API versions
  const languageMap = {
    "javascript": { language: "javascript", version: "18.15.0" },
    "python": { language: "python", version: "3.10.0" },
    "java": { language: "java", version: "15.0.2" },
    "c_cpp": { language: "c++", version: "10.2.0" },
  };

  if (!languageMap[language]) {
    return res.status(400).send({ output: "Language not supported for execution" });
  }

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: languageMap[language].language,
      version: languageMap[language].version,
      files: [{ content: code }]
    });
    res.json({ output: response.data.run.output });
  } catch (error) {
    console.error('CODE EXECUTION ERROR:', error.message);
    res.status(500).send({ output: "Error executing code" });
  }
});

// ==========================
//      SOCKET.IO LOGIC
// ==========================

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // --- WHITEBOARD EVENTS ---
  socket.on('drawing', ({ newLine, roomId }) => {
    socket.to(roomId).emit('drawing', newLine);
  });

  socket.on('undo', ({ roomId }) => {
    io.in(roomId).emit('undo-line');
  });

  socket.on('clear-canvas', ({ roomId }) => {
    io.in(roomId).emit('canvas-cleared');
  });

  // --- CODE EDITOR EVENTS ---
  socket.on('code-change', ({ code, roomId }) => {
    socket.to(roomId).emit('code-change', code);
  });

  socket.on('language-change', ({ language, roomId }) => {
    socket.to(roomId).emit('language-change', language);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`Server started successfully on port ${PORT}`));