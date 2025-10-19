import React from 'react';
import { Container, Row, Col, Nav, Navbar, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { HouseDoorFill, DatabaseFill, Diagram3Fill, JournalBookmarkFill, Robot, Tools, PuzzleFill, CloudArrowUpFill, BoxArrowRight } from 'react-bootstrap-icons';
import { useAuth } from '../App';

const Layout = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="flex-column p-3 shadow-lg" style={{ width: '250px' }}>
        <Navbar.Brand as={Link} to="/dashboard" className="mb-4 fw-bold fs-4 text-white">AgentProvision</Navbar.Brand>
        <Nav className="flex-column w-100">
          <Nav.Link as={Link} to="/dashboard" className="text-light d-flex align-items-center py-2"><HouseDoorFill className="me-2" /> Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/data-sources" className="text-light d-flex align-items-center py-2"><DatabaseFill className="me-2" /> Data Sources</Nav.Link>
          <Nav.Link as={Link} to="/data-pipelines" className="text-light d-flex align-items-center py-2"><Diagram3Fill className="me-2" /> Data Pipelines</Nav.Link>
          <Nav.Link as={Link} to="/notebooks" className="text-light d-flex align-items-center py-2"><JournalBookmarkFill className="me-2" /> Notebooks</Nav.Link>
          <Nav.Link as={Link} to="/agents" className="text-light d-flex align-items-center py-2"><Robot className="me-2" /> Agents</Nav.Link>
          <Nav.Link as={Link} to="/tools" className="text-light d-flex align-items-center py-2"><Tools className="me-2" /> Tools</Nav.Link>
          <Nav.Link as={Link} to="/connectors" className="text-light d-flex align-items-center py-2"><PuzzleFill className="me-2" /> Connectors</Nav.Link>
          <Nav.Link as={Link} to="/deployments" className="text-light d-flex align-items-center py-2"><CloudArrowUpFill className="me-2" /> Deployments</Nav.Link>
        </Nav>
      </Navbar>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navbar for User Info and Logout */}
        <Navbar bg="white" variant="light" className="shadow-sm py-3">
          <Container fluid>
            <Navbar.Brand>Welcome, {auth.user ? auth.user.email : 'Guest'}</Navbar.Brand>
            <Nav className="ms-auto">
              <Button variant="outline-secondary" onClick={handleLogout} className="d-flex align-items-center">
                <BoxArrowRight className="me-2" /> Logout
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