import React, { useMemo } from 'react';
import { Container, Nav, Navbar, Button, Dropdown, Badge } from 'react-bootstrap';
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
  BuildingFill
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
        { path: '/home', icon: HouseDoorFill, label: 'Home' },
        { path: '/dashboard', icon: BarChartFill, label: 'Dashboard' },
        { path: '/datasets', icon: FileTextFill, label: 'Reports & Data' },
      ]
    },
    {
      title: 'AI ASSISTANT',
      items: [
        { path: '/chat', icon: ChatDotsFill, label: 'Ask AI' },
        { path: '/agents', icon: Robot, label: 'AI Assistants' },
        { path: '/agent-kits', icon: Grid3x3GapFill, label: 'AI Templates' },
      ]
    },
    {
      title: 'WORKSPACE',
      items: [
        { path: '/data-sources', icon: PlugFill, label: 'Data Connections' },
        { path: '/data-pipelines', icon: DatabaseFill, label: 'Automations' },
        { path: '/tenants', icon: BuildingFill, label: 'Organization' },
        { path: '/settings', icon: GearFill, label: 'Settings' },
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
                  <Nav.Link
                    key={item.path}
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