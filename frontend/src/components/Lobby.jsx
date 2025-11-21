import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Form, Button, Container } from 'react-bootstrap';

const Lobby = () => {
  const [room, setRoom] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser.user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error decoding token', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleCreateRoom = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/rooms/create');
      const { roomId } = res.data;
      navigate(`/room/${roomId}`);
    } catch (error)  {    console.error('Error creating room', error);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (room.trim()) {
      navigate(`/room/${room}`);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container className="py-5">
      <div className="w-100 form-container" style={{ maxWidth: '500px', margin: 'auto' }}>
        <h2 className="text-center mb-4">Welcome, {user.email}!</h2>
        <p className="text-center text-muted mb-4">Create a new collaborative room or join an existing one.</p>
        <Button onClick={handleCreateRoom} className="w-100">
          Create New Room
        </Button>
        <hr style={{ margin: '20px 0' }} />
        <Form onSubmit={handleJoinRoom}>
          <Form.Group>
            <Form.Control
              type="text"
              value={room}
              // THIS IS THE LINE THAT WAS MISSING
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter Room ID to Join"
              className="text-center"
            />
          </Form.Group>
          <Button type="submit" className="w-100 mt-2">
            Join Room
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Lobby;