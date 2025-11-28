import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import { ToastProvider } from './components/common';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './LandingPage';
import AgentKitsPage from './pages/AgentKitsPage';
import AgentsPage from './pages/AgentsPage';
import AgentWizardPage from './pages/AgentWizardPage';
import BrandingPage from './pages/BrandingPage';
import ChatPage from './pages/ChatPage';
import ConnectorsPage from './pages/ConnectorsPage';
import DashboardPage from './pages/DashboardPage';
import DataPipelinesPage from './pages/DataPipelinesPage';
import DatasetsPage from './pages/DatasetsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import DeploymentsPage from './pages/DeploymentsPage';
import HomePage from './pages/HomePage';
import LLMSettingsPage from './pages/LLMSettingsPage';
import LoginPage from './pages/LoginPage';
import MemoryPage from './pages/MemoryPage';
import NotebooksPage from './pages/NotebooksPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import TeamsPage from './pages/TeamsPage';
import TenantsPage from './pages/TenantsPage';
import ToolsPage from './pages/ToolsPage';
import VectorStoresPage from './pages/VectorStoresPage';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/data-sources" element={<ProtectedRoute><DataSourcesPage /></ProtectedRoute>} />
            <Route path="/data-pipelines" element={<ProtectedRoute><DataPipelinesPage /></ProtectedRoute>} />
            <Route path="/notebooks" element={<ProtectedRoute><NotebooksPage /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
            <Route path="/agents/wizard" element={<ProtectedRoute><AgentWizardPage /></ProtectedRoute>} />
            <Route path="/datasets" element={<ProtectedRoute><DatasetsPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
            <Route path="/connectors" element={<ProtectedRoute><ConnectorsPage /></ProtectedRoute>} />
            <Route path="/deployments" element={<ProtectedRoute><DeploymentsPage /></ProtectedRoute>} />
            <Route path="/vector-stores" element={<ProtectedRoute><VectorStoresPage /></ProtectedRoute>} />
            <Route path="/agent-kits" element={<ProtectedRoute><AgentKitsPage /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
            <Route path="/memory" element={<ProtectedRoute><MemoryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/llm" element={<ProtectedRoute><LLMSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/branding" element={<ProtectedRoute><BrandingPage /></ProtectedRoute>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
