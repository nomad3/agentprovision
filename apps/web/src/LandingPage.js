import React from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Card } from 'react-bootstrap';
import { FaBrain, FaCloud, FaCogs, FaLock, FaGlobe, FaLaptopCode, FaChartLine, FaDatabase, FaRoad, FaUsers, FaShieldAlt, FaCubes, FaRobot, FaCodeBranch } from 'react-icons/fa';

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
              <Nav.Link href="#lakehouse" className="mx-2 text-light">Lakehouse</Nav.Link>
              <Nav.Link href="#ai-capabilities" className="mx-2 text-light">AI Capabilities</Nav.Link>
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(/images/enterprise-ai.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '700px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Container className="position-relative">
          <h1 className="display-2 fw-bold mb-4 animate__animated animate__fadeInDown">
            The Unified Data Intelligence Platform for AI
          </h1>
          <p className="fs-4 mb-5 mx-auto text-light animate__animated animate__fadeInUp" style={{ maxWidth: '800px' }}>
            Unify your data, analytics, and AI workloads. Build, deploy, and manage intelligent agents across multi-cloud environments with enterprise-grade security and scalability.
          </p>
          <Button variant="primary" size="lg" className="mt-3 px-5 py-3 rounded-pill animate__animated animate__zoomIn" href="/get-started">Start Your Free Trial</Button>
        </Container>
      </div>

      {/* Features Section */}
      <div id="features" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">Accelerate Your Data & AI Journey</h2>
          <Row className="g-4 justify-content-center">
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInLeft">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaLaptopCode size={60} className="text-primary" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Collaborative Notebooks</Card.Title>
                  <Card.Text className="text-light">Empower data teams with real-time collaborative notebooks for data exploration, advanced analytics, and robust model building.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInUp">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaChartLine size={60} className="text-success" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Unified Platform</Card.Title>
                  <Card.Text className="text-light">A single, cohesive platform integrating data engineering, data science, machine learning, and business intelligence workflows.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 bg-dark text-light border-0 shadow-lg animate__animated animate__fadeInRight">
                <Card.Body className="text-center p-4">
                  <div className="mb-3"><FaDatabase size={60} className="text-info" /></div>
                  <Card.Title as="h3" className="fw-bold text-white">Reliable Data Pipelines</Card.Title>
                  <Card.Text className="text-light">Build, manage, and monitor robust data pipelines for seamless ingestion, transformation, and processing of data from any source.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Data Lakehouse Advantage Section */}
      <div id="lakehouse" className="py-5 bg-dark">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">The Data Lakehouse Advantage</h2>
          <Row className="g-4 align-items-center">
            <Col md={6}>
              <img src="/images/data-pipelines.jpg" alt="Data Lakehouse" className="img-fluid rounded shadow-lg animate__animated animate__fadeInLeft" />
            </Col>
            <Col md={6}>
              <h3 className="display-6 fw-bold text-white animate__animated animate__fadeInRight">Unify Your Data Strategy</h3>
              <p className="fs-5 text-light mt-3 animate__animated animate__fadeInRight" style={{ animationDelay: '0.2s' }}>
                AgentProvision combines the flexibility and scale of data lakes with the ACID transactions and governance of data warehouses. Store all your data – structured, semi-structured, and unstructured – in one place, ready for any workload.
              </p>
              <ul className="list-unstyled text-light mt-4 animate__animated animate__fadeInRight" style={{ animationDelay: '0.4s' }}>
                <li><FaCubes className="text-primary me-2" /> Scalable storage for all data types</li>
                <li><FaCodeBranch className="text-success me-2" /> ACID transactions for data reliability</li>
                <li><FaShieldAlt className="text-warning me-2" /> Enhanced data governance and security</li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>

      {/* AI-Powered Capabilities Section */}
      <div id="ai-capabilities" className="py-5 bg-secondary">
        <Container>
          <h2 className="text-center display-4 fw-bold mb-5 text-white">Intelligent Agents, Seamlessly Orchestrated</h2>
          <Row className="g-4 align-items-center flex-row-reverse">
            <Col md={6}>
              <img src="/images/ai-agents.jpg" alt="AI Agents" className="img-fluid rounded shadow-lg animate__animated animate__fadeInRight" />
            </Col>
            <Col md={6}>
              <h3 className="display-6 fw-bold text-white animate__animated animate__fadeInLeft">Orchestrate AI at Scale</h3>
              <p className="fs-5 text-light mt-3 animate__animated animate__fadeInLeft" style={{ animationDelay: '0.2s' }}>
                Deploy, manage, and monitor your AI agents across diverse multi-cloud environments. AgentProvision provides the control plane for your intelligent automation, ensuring optimal performance and resource utilization.
              </p>
              <ul className="list-unstyled text-light mt-4 animate__animated animate__fadeInLeft" style={{ animationDelay: '0.4s' }}>
                <li><FaRobot className="text-primary me-2" /> Centralized agent lifecycle management</li>
                <li><FaCloud className="text-success me-2" /> Flexible multi-cloud deployment</li>
                <li><FaChartLine className="text-warning me-2" /> Real-time performance monitoring</li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Roadmap Section */}
      <div id="roadmap" className="py-5 bg-dark">
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
                  <Card.Text className="text-light text-center">Connect OpenTelemetry traces to Grafana dashboards and expose FinOps insights via cost APIs for deeper monitoring and cost management.</Card.Text>
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
