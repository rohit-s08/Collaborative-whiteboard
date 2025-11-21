// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Lobby from './components/Lobby.jsx'; // Import Lobby instead of Dashboard
import Room from './components/Room.jsx';   // Import the new Room component
import ParticlesComponent from './components/ParticlesComponent.jsx';

// Your stylesheets
import './App.css';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Lobby />} /> {/* Use Lobby here */}
          <Route path="/room/:roomId" element={<Room />} /> {/* Add the new dynamic route */}
        </Routes>
      </div>
    </Router>
  );
}
export default App;