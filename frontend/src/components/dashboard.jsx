import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('token');
    // Redirect to the login page
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome to your Dashboard</h2>
      <p>You have successfully logged in!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;