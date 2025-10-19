import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';

// Placeholder Dashboard Component
const Dashboard = () => {
  return (
    <Layout>
      <h2>Welcome to your Dashboard!</h2>
      <p>This is a placeholder for your main dashboard content.</p>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add other dashboard routes here later */}
      </Routes>
    </Router>
  );
}

export default App;