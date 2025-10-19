import React from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Card } from 'react-bootstrap';
import { FaBrain, FaCloud, FaCogs, FaLock, FaGlobe, FaLaptopCode, FaChartLine, FaDatabase } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="bg-dark text-white">
      {/* Header */}
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand href="#home" className="fw-bold fs-4">AgentProvision</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#features" className="mx-2">Features</Nav.Link>
              <Nav.Link href="#why-us" className="mx-2">Why Us</Nav.Link>
              <Nav.Link href="#contact" className="mx-2">Contact</Nav.Link>
            </Nav>
            <Button variant="primary" className="ms-3" href="/register">Sign Up</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="py-5 text-center bg-dark text-white position-relative overflow-hidden"
        style={{
          paddingTop: '120px',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1596526131083-a8c551647953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NzQ5MzZ8MHwxfHNlYXJjaHwxfHxlbnRlcnByaXNlJTIwYWklMjBjb25jZXB0fGVufDB8fHx8MTcwMTY1NDY1Nnww&ixlib=rb-4.0.3&q=80&w=1080)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '700px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Container className="position-relative">
          <h1 className="display-2 fw-bold mb-4 animate__animated animate__fadeInDown">
            The Unified Data & AI Platform for Enterprises
          </h1>
          <p className="fs-4 mb-5 mx-auto animate__animated animate__fadeInUp" style={{ maxWidth: '800px' }}>
            Orchestrate AI agents, build robust data pipelines, and unlock insights across multi-cloud environments with enterprise-grade security and scalability.
          </p>
          <Button variant="primary" size="lg" className="mt-3 px-5 py-3 rounded-pill animate__animated animate__zoomIn" href="/get-started">Get Started for Free</Button>
        </Container>
      </div>

      {/* Features Section */}
      <div id="features" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5">A Platform for the Entire AI Lifecycle</h2>
          <Row className="g-4 justify-content-center">
            <Col md={4}>
              <Card className="h-100 bg-dark text-white border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaLaptopCode size={60} className="text-primary" /></div>
                  <Card.Title as="h3" className="fw-bold">Collaborative Notebooks</Card.Title>
                  <Card.Text className="text-muted">Work together in real-time on notebooks for data exploration, analysis, and model building, fostering innovation and efficiency.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-white border-0 shadow-lg animate__animated animate__fadeInUp">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaChartLine size={60} className="text-success" /></div>
                  <Card.Title as="h3" className="fw-bold">Unified Data & AI</Card.Title>
                  <Card.Text className="text-muted">A single platform for data engineering, data science, machine learning, and business intelligence, streamlining your entire workflow.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-white border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaDatabase size={60} className="text-info" /></div>
                  <Card.Title as="h3" className="fw-bold">Reliable Data Pipelines</Card.Title>
                  <Card.Text className="text-muted">Build and manage reliable data pipelines to ingest, transform, and process data from any source, ensuring data quality and availability.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Why Us Section */}
      <div id="why-us" className="py-5 bg-dark">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5">Why AgentProvision?</h2>
          <Row className="g-4 align-items-center">
            <Col md={6}>
              <Card className="h-100 bg-secondary text-white border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaLock size={60} className="text-warning" /></div>
                  <Card.Title as="h3" className="fw-bold text-center">Built for the Enterprise</Card.Title>
                  <Card.Text className="text-muted text-center">AgentProvision is designed for the security, scalability, and compliance needs of large organizations. With features like multi-tenant control plane and enterprise-ready authentication, your data and AI assets are secure.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 bg-secondary text-white border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaGlobe size={60} className="text-danger" /></div>
                  <Card.Title as="h3" className="fw-bold text-center">Multi-Cloud, Your Way</Card.Title>
                  <Card.Text className="text-muted text-center">Deploy your AI agents and data pipelines across multiple cloud providers with ease. Our infrastructure-as-code assets for Terraform make it simple to provision and manage your infrastructure.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <footer className="bg-dark py-4 border-top border-secondary">
        <Container className="text-center text-muted">
          <p className="mb-0">&copy; 2025 AgentProvision. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
