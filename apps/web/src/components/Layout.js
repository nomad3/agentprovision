import React, { useMemo } from 'react';
import { Container, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { HouseDoorFill, DatabaseFill, Diagram3Fill, JournalBookmarkFill, Robot, Tools, PuzzleFill, CloudArrowUpFill, BoxArrowRight, ChatDotsFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';

const Layout = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
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

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="flex-column p-3 shadow-lg" style={{ width: '250px' }}>
        <Navbar.Brand as={Link} to="/dashboard" className="mb-4 fw-bold fs-4 text-white">{t('brand')}</Navbar.Brand>
        <Nav className="flex-column w-100">
          <Nav.Link as={Link} to="/dashboard" className="text-light d-flex align-items-center py-2"><HouseDoorFill className="me-2" /> {t('sidebar.dashboard')}</Nav.Link>
          <Nav.Link as={Link} to="/data-sources" className="text-light d-flex align-items-center py-2"><DatabaseFill className="me-2" /> {t('sidebar.dataSources')}</Nav.Link>
          <Nav.Link as={Link} to="/data-pipelines" className="text-light d-flex align-items-center py-2"><Diagram3Fill className="me-2" /> {t('sidebar.dataPipelines')}</Nav.Link>
          <Nav.Link as={Link} to="/notebooks" className="text-light d-flex align-items-center py-2"><JournalBookmarkFill className="me-2" /> {t('sidebar.notebooks')}</Nav.Link>
          <Nav.Link as={Link} to="/agents" className="text-light d-flex align-items-center py-2"><Robot className="me-2" /> {t('sidebar.agents')}</Nav.Link>
          <Nav.Link as={Link} to="/datasets" className="text-light d-flex align-items-center py-2"><DatabaseFill className="me-2" /> {t('sidebar.datasets')}</Nav.Link>
          <Nav.Link as={Link} to="/chat" className="text-light d-flex align-items-center py-2"><ChatDotsFill className="me-2" /> {t('sidebar.chat')}</Nav.Link>
          <Nav.Link as={Link} to="/tools" className="text-light d-flex align-items-center py-2"><Tools className="me-2" /> {t('sidebar.tools')}</Nav.Link>
          <Nav.Link as={Link} to="/connectors" className="text-light d-flex align-items-center py-2"><PuzzleFill className="me-2" /> {t('sidebar.connectors')}</Nav.Link>
          <Nav.Link as={Link} to="/deployments" className="text-light d-flex align-items-center py-2"><CloudArrowUpFill className="me-2" /> {t('sidebar.deployments')}</Nav.Link>
          <Nav.Link as={Link} to="/vector-stores" className="text-light d-flex align-items-center py-2"><Diagram3Fill className="me-2" /> {t('sidebar.vectorStores')}</Nav.Link>
          <Nav.Link as={Link} to="/agent-kits" className="text-light d-flex align-items-center py-2"><Robot className="me-2" /> {t('sidebar.agentKits')}</Nav.Link>
        </Nav>
      </Navbar>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navbar for User Info and Logout */}
        <Navbar bg="white" variant="light" className="shadow-sm py-3">
          <Container fluid>
            <Navbar.Brand>
              {t('layout.welcome', {
                name: auth.user ? auth.user.email : t('layout.guest'),
              })}
            </Navbar.Brand>
            <Nav className="ms-auto">
              <Dropdown align="end" className="me-3">
                <Dropdown.Toggle variant="outline-secondary" size="sm" className="text-uppercase">
                  {currentLanguage.toUpperCase()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {languageOptions.map(({ code, label }) => (
                    <Dropdown.Item
                      key={code}
                      active={currentLanguage === code}
                      onClick={() => handleLanguageChange(code)}
                    >
                      {label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="outline-secondary" onClick={handleLogout} className="d-flex align-items-center">
                <BoxArrowRight className="me-2" /> {t('layout.logout')}
              </Button>
            </Nav>
          </Container>
        </Navbar>

        <Container fluid className="p-4">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default Layout;