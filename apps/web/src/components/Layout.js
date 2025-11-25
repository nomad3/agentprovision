import React, { useMemo } from 'react';
import { Container, Nav, Navbar, Button, Dropdown, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HouseDoorFill,
  DatabaseFill,
  BarChartFill,
  FileTextFill,
  Robot,
  ChatDotsFill,
  Grid3x3GapFill,
  PlugFill,
  GearFill,
  BoxArrowRight,
  PersonCircle,
  LightbulbFill,
  BuildingFill,
  PeopleFill,
  BrainFill,
  CpuFill,
  PaletteFill
} from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import './Layout.css';

const Layout = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('common');

  const currentLanguage = (i18n.language || 'en').split('-')[0];
  const languageOptions = useMemo(
    () => [
      { code: 'en', label: t('language.english') },
      { code: 'es', label: t('language.spanish') },
    ],
    [t, i18n.language]
  );

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };

  // Simplified 3-section navigation for business users
  const navSections = [
    {
      title: 'INSIGHTS',
      items: [
        { path: '/home', icon: HouseDoorFill, label: 'Home', description: 'Your personalized homepage and quick start guide' },
        { path: '/dashboard', icon: BarChartFill, label: 'Dashboard', description: 'Platform analytics and activity overview' },
        { path: '/datasets', icon: FileTextFill, label: 'Reports & Data', description: 'Upload files and view your datasets' },
      ]
    },
    {
      title: 'AI ASSISTANT',
      items: [
        { path: '/chat', icon: ChatDotsFill, label: 'Ask AI', description: 'Chat with your AI agents and get insights' },
        { path: '/agents', icon: Robot, label: 'AI Assistants', description: 'Create and manage your AI agents' },
        { path: '/agent-kits', icon: Grid3x3GapFill, label: 'AI Templates', description: 'Save and reuse agent configurations' },
        { path: '/teams', icon: PeopleFill, label: 'Teams', description: 'Manage agent teams and group assignments' },
        { path: '/memory', icon: BrainFill, label: 'Memory', description: 'View and manage agent memory and conversation history' },
      ]
    },
    {
      title: 'WORKSPACE',
      items: [
        { path: '/data-sources', icon: PlugFill, label: 'Data Connections', description: 'Connect to databases and external tools' },
        { path: '/data-pipelines', icon: DatabaseFill, label: 'Automations', description: 'Set up automated data pipelines and workflows' },
        { path: '/tenants', icon: BuildingFill, label: 'Organization', description: 'Manage teams and permissions' },
        { path: '/settings/llm', icon: CpuFill, label: 'LLM Models', description: 'Configure AI models and API settings' },
        { path: '/settings/branding', icon: PaletteFill, label: 'Branding', description: 'Customize platform appearance and branding' },
        { path: '/settings', icon: GearFill, label: 'Settings', description: 'Configure your account preferences' },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-container">
      {/* Glassmorphic Sidebar */}
      <div className="sidebar-glass">
        <div className="sidebar-header">
          <Link to="/dashboard" className="brand-link">
            <div className="brand-icon">
              <Robot size={28} />
            </div>
            <span className="brand-text">{t('brand')}</span>
          </Link>
        </div>

        <Nav className="flex-column sidebar-nav">
          {navSections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="nav-section">
              <div className="nav-section-header">
                <span className="nav-section-title">{section.title}</span>
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <OverlayTrigger
                    key={item.path}
                    placement="right"
                    delay={{ show: 500, hide: 0 }}
                    overlay={<Tooltip id={`tooltip-${item.path}`}>{item.description}</Tooltip>}
                  >
                    <Nav.Link
                      as={Link}
                      to={item.path}
                      className={`sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                      <Icon className="nav-icon" size={20} />
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <Badge bg="primary" className="nav-badge">{item.badge}</Badge>
                      )}
                    </Nav.Link>
                  </OverlayTrigger>
                );
              })}
            </div>
          ))}
        </Nav>

        <div className="sidebar-footer">
          <Dropdown drop="up" className="w-100">
            <Dropdown.Toggle variant="link" className="user-dropdown-toggle w-100">
              <div className="d-flex align-items-center gap-2">
                <PersonCircle size={32} className="text-primary" />
                <div className="flex-grow-1 text-start">
                  <div className="user-email">{auth.user?.email || 'Guest'}</div>
                  <div className="user-role">Administrator</div>
                </div>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              <Dropdown.Header>Language</Dropdown.Header>
              {languageOptions.map(({ code, label }) => (
                <Dropdown.Item
                  key={code}
                  active={currentLanguage === code}
                  onClick={() => handleLanguageChange(code)}
                >
                  {label}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <BoxArrowRight className="me-2" /> {t('layout.logout')}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;