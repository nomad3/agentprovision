import React from 'react';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="flex-column p-3" style={{ width: '250px' }}>
        <Navbar.Brand as={Link} to="/dashboard" className="mb-3">AgentProvision</Navbar.Brand>
        <Nav className="flex-column w-100">
          <Nav.Link as={Link} to="/dashboard" className="text-light">Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/data-sources" className="text-light">Data Sources</Nav.Link>
          <Nav.Link as={Link} to="/data-pipelines" className="text-light">Data Pipelines</Nav.Link>
          <Nav.Link as={Link} to="/notebooks" className="text-light">Notebooks</Nav.Link>
          <Nav.Link as={Link} to="/agents" className="text-light">Agents</Nav.Link>
          <Nav.Link as={Link} to="/tools" className="text-light">Tools</Nav.Link>
          <Nav.Link as={Link} to="/connectors" className="text-light">Connectors</Nav.Link>
          <Nav.Link as={Link} to="/deployments" className="text-light">Deployments</Nav.Link>
        </Nav>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="p-4 flex-grow-1 bg-light">
        {children}
      </Container>
    </div>
  );
};

export default Layout;
