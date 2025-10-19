import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import authService from './services/auth';

// Create an Auth Context
const AuthContext = createContext(null);

// Auth Provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const navigate = useNavigate();

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Placeholder Dashboard Component
const Dashboard = () => {
  const auth = useAuth();
  if (!auth.user) {
    // Redirect to login if not authenticated
    return <LoginPage />;
  }
  return (
    <Layout>
      <h2>Welcome to your Dashboard!</h2>
      <p>This is a placeholder for your main dashboard content.</p>
      <button onClick={auth.logout}>Logout</button>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add other dashboard routes here later */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
