import React from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Card } from 'react-bootstrap';
import { FaBrain, FaCloud, FaCogs, FaLock, FaGlobe } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="bg-dark text-white">
      {/* Header */}
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand href="#home">AgentProvision</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#features">Features</Nav.Link>
              <Nav.Link href="#why-us">Why Us</Nav.Link>
              <Nav.Link href="#pricing">Pricing</Nav.Link>
            </Nav>
            <Button variant="primary" href="/register">Sign Up</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="py-5 text-center bg-dark text-white position-relative overflow-hidden"
        style={{
          paddingTop: '100px',
          backgroundImage: `url(https://via.placeholder.com/1080x600/000000/FFFFFF?text=Enterprise+AI)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-75"></div>
        <Container className="position-relative">
          <h1 className="display-3 fw-bold mb-3 animate__animated animate__fadeInDown">
            The Enterprise Data & AI Platform
          </h1>
          <p className="fs-5 mb-4 mx-auto animate__animated animate__fadeInUp" style={{ maxWidth: '700px' }}>
            Build, deploy, and manage your AI agents and data pipelines on a unified platform. AgentProvision provides the foundation for your enterprise AI strategy.
          </p>
          <Button variant="primary" size="lg" className="mt-3 animate__animated animate__zoomIn" href="/get-started">Get Started for Free</Button>
        </Container>
      </div>

      {/* Features Section */}
      <div id="features" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5">A Platform for the Entire AI Lifecycle</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 bg-dark text-white animate__animated animate__fadeInLeft">
                <Card.Body>
                  <div className="text-center mb-3"><FaBrain size={50} /></div>
                  <Card.Title as="h3">Collaborative Notebooks</Card.Title>
                  <Card.Text>Work together in real-time on notebooks for data exploration, analysis, and model building.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-white animate__animated animate__fadeInUp">
                <Card.Body>
                  <div className="text-center mb-3"><FaCloud size={50} /></div>
                  <Card.Title as="h3">Unified Data & AI</Card.Title>
                  <Card.Text>A single platform for data engineering, data science, machine learning, and business intelligence.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-white animate__animated animate__fadeInRight">
                <Card.Body>
                  <div className="text-center mb-3"><FaCogs size={50} /></div>
                  <Card.Title as="h3">Reliable Data Pipelines</Card.Title>
                  <Card.Text>Build and manage reliable data pipelines to ingest, transform, and process data from any source.</Card.Text>
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
              <Card className="h-100 bg-secondary text-white animate__animated animate__fadeInLeft">
                <Card.Body>
                  <div className="text-center mb-3"><FaLock size={50} /></div>
                  <Card.Title as="h3">Built for the Enterprise</Card.Title>
                  <Card.Text>AgentProvision is designed for the security, scalability, and compliance needs of large organizations. With features like multi-tenant control plane and enterprise-ready authentication, you can be sure your data and AI assets are secure.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 bg-secondary text-white animate__animated animate__fadeInRight">
                <Card.Body>
                  <div className="text-center mb-3"><FaGlobe size={50} /></div>
                  <Card.Title as="h3">Multi-Cloud, Your Way</Card.Title>
                  <Card.Text>Deploy your AI agents and data pipelines across multiple cloud providers with ease. Our infrastructure-as-code assets for Terraform make it simple to provision and manage your infrastructure.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <footer className="bg-dark py-4">
        <Container className="text-center text-muted">
          <p>&copy; 2025 AgentProvision. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;