import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/register', formData);
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <Container className="py-5">
      <div className="w-100 form-container" style={{ maxWidth: '400px', margin: 'auto' }}>
        <h2 className="text-center mb-4">Register</h2>
        {message && <Alert variant={message.includes('successful') ? 'success' : 'danger'}>{message}</Alert>}
        <Form onSubmit={onSubmit}>
          <Form.Group id="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={email}
              onChange={onChange} // <-- This handler was likely missing
              required
            />
          </Form.Group>
          <Form.Group id="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={password}
              onChange={onChange} // <-- This handler was likely missing
              minLength="6"
              required
            />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">
            Register
          </Button>
        </Form>
        <div className="w-100 text-center mt-3">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </Container>
  );
};

export default Register;