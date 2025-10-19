import React from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Card } from 'react-bootstrap';
import { FaBrain, FaCloud, FaCogs, FaLock, FaGlobe, FaLaptopCode, FaChartLine, FaDatabase, FaRoad, FaUsers, FaShieldAlt } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="bg-dark text-light">
      {/* Header */}
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="shadow-sm">
        <Container>
          <Navbar.Brand href="#home" className="fw-bold fs-4 text-white">AgentProvision</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#features" className="mx-2 text-light">Features</Nav.Link>
              <Nav.Link href="#highlights" className="mx-2 text-light">Highlights</Nav.Link>
              <Nav.Link href="#roadmap" className="mx-2 text-light">Roadmap</Nav.Link>
              <Nav.Link href="#contact" className="mx-2 text-light">Contact</Nav.Link>
            </Nav>
            <Button variant="primary" className="ms-3" href="/register">Sign Up</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="py-5 text-center bg-dark text-white position-relative overflow-hidden"
        style={{
          paddingTop: '120px',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(https://images.unsplash.com/photo-1596526131083-a8c551647953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NzQ5MzZ8MHwxfHNlYXJjaHwxfHxlbnRlcnByaXNlJTIwYWklMjBjb25jZXB0fGVufDB8fHx8MTcwMTY1NDY1Nnww&ixlib=rb-4.0.3&q=80&w=1080)`,
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
          <p className="fs-4 mb-5 mx-auto text-light animate__animated animate__fadeInUp" style={{ maxWidth: '800px' }}>
            Orchestrate AI agents, build robust data pipelines, and unlock insights across multi-cloud environments with enterprise-grade security and scalability.
          </p>
          <Button variant="primary" size="lg" className="mt-3 px-5 py-3 rounded-pill animate__animated animate__zoomIn" href="/get-started">Get Started for Free</Button>
        </Container>
      </div>

      {/* Features Section */}
      <div id="features" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">A Platform for the Entire AI Lifecycle</h2>
          <Row className="g-4 justify-content-center">
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaLaptopCode size={60} className="text-primary" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Collaborative Notebooks</Card.Title>
                  <Card.Text className="text-light">Work together in real-time on notebooks for data exploration, analysis, and model building, fostering innovation and efficiency.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInUp">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaChartLine size={60} className="text-success" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Unified Data & AI</Card.Title>
                  <Card.Text className="text-light">A single platform for data engineering, data science, machine learning, and business intelligence, streamlining your entire workflow.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaDatabase size={60} className="text-info" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Reliable Data Pipelines</Card.Title>
                  <Card.Text className="text-light">Build and manage reliable data pipelines to ingest, transform, and process data from any source, ensuring data quality and availability.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Highlights Section */}
      <div id="highlights" className="py-5 bg-dark">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">Platform Highlights</h2>
          <Row className="g-4 justify-content-center">
            <Col md={6}>
              <Card className="h-100 bg-secondary text-light border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaUsers size={60} className="text-primary" /></div>
                  <Card.Title as="h3" className="fw-bold text-center text-white">Multi-tenant Control Plane</Card.Title>
                  <Card.Text className="text-light text-center">Manage isolated tenants, agents, deployments, and users with JWT-secured APIs, providing robust separation and control for enterprise environments.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 bg-secondary text-light border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaShieldAlt size={60} className="text-success" /></div>
                  <Card.Title as="h3" className="fw-bold text-center text-white">Enterprise-Ready Authentication</Card.Title>
                  <Card.Text className="text-light text-center">Features like password hashing, token issuance, and demo seed data for instant evaluation ensure secure and seamless access management.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 bg-secondary text-light border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaLaptopCode size={60} className="text-info" /></div>
                  <Card.Title as="h3" className="fw-bold text-center text-white">Interactive Console</Card.Title>
                  <Card.Text className="text-light text-center">A protected dashboard featuring live analytics, fleet overview, deployment status, and workspace settings for comprehensive operational control.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 bg-secondary text-light border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaGlobe size={60} className="text-warning" /></div>
                  <Card.Title as="h3" className="fw-bold text-center text-white">Infrastructure Foundations</Card.Title>
                  <Card.Text className="text-light text-center">Leverage Docker-compose for local development and Terraform scaffolding targeting AWS (EKS, Aurora, S3) for robust infrastructure provisioning.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Roadmap Section */}
      <div id="roadmap" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">Roadmap Ideas</h2>
          <Row className="g-4 justify-content-center">
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="p-4">
                  <div className="mb-3 text-center"><FaRoad size={60} className="text-primary" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Integrate OAuth/SAML SSO</Card.Title>
                  <Card.Text className="text-light text-center">Seamlessly integrate with enterprise identity providers like Okta and Azure AD for single sign-on capabilities.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInUp">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaBrain size={60} className="text-success" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Agent Creation Wizards</Card.Title>
                  <Card.Text className="text-light text-center">Develop intuitive wizards for agent creation, comprehensive evaluation dashboards, and a visual editor for LangGraph workflows.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaChartLine size={60} className="text-info" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Expand Observability</Card.Title>
                  <Card.Text className="text-light text-center">Connect OpenTelemetry traces to Grafana dashboards and expose FinOps insights via cost APIs for comprehensive monitoring.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
            <footer className="bg-dark py-4 border-top border-secondary">
              <Container className="text-center text-light">
                <p className="mb-0">&copy; 2025 AgentProvision. All rights reserved.</p>
              </Container>
            </footer>
          </div>
        );
      };
      
      export default LandingPage;
      