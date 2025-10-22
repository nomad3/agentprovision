import React, { useMemo } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button } from 'react-bootstrap';
import HeroSection from './components/marketing/HeroSection';
import {
  metrics,
  features,
  lakehouseHighlights,
  aiHighlights,
  roadmap,
  testimonials,
  highlights,
  logoBadges,
  architectureLayers,
} from './components/marketing/data';

const LandingPage = () => {
  const metricsChunks = useMemo(() => [metrics.slice(0, 3)], []);

  return (
    <div>
      <Navbar expand="lg" fixed="top" className="nav-dark py-3">
        <Container>
          <Navbar.Brand href="#hero" className="fw-semibold text-white">
            AgentProvision
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="primary-nav" className="border-0" />
          <Navbar.Collapse id="primary-nav">
            <Nav className="ms-auto align-items-lg-center gap-lg-4">
              <Nav.Link href="#features" className="mx-2">Platform</Nav.Link>
              <Nav.Link href="#architecture" className="mx-2">Architecture</Nav.Link>
              <Nav.Link href="#stories" className="mx-2">Customers</Nav.Link>
              <Nav.Link href="#cta" className="mx-2">Pricing &amp; ROI</Nav.Link>
              <Button href="/register" className="ms-lg-4 px-4 py-2">
                Book a demo
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        <HeroSection />

        <section id="logos" className="section-thin">
          <Container>
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 text-uppercase text-soft">
              <span className="fw-semibold me-2">Trusted by teams at</span>
              {logoBadges.map((name) => (
                <span key={name} className="logo-badge">
                  {name}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <section className="section-wrapper section-ink metrics-section" id="metrics">
          <Container>
            {metricsChunks.map((group, index) => (
              <Row className="g-4 justify-content-center" key={`metrics-${index}`}>
                {group.map((metric) => (
                  <Col md={4} key={metric.label}>
                    <div className="metric-tile h-100">
                      <div className="text-uppercase text-sm text-soft fw-semibold tracking-wide">
                        {metric.label}
                      </div>
                      <h3 className="display-5 fw-bold mt-2 mb-3">{metric.value}</h3>
                      <p className="text-contrast mb-0">{metric.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            ))}
          </Container>
        </section>

        <section id="features" className="section-wrapper section-dark">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold section-heading">Accelerate trusted analytics and automations</h2>
              <p className="lead section-subtitle mt-3">
                Ship governed copilots faster with reusable intelligence, semantic metrics, and a collaborative workspace for data and operations leaders.
              </p>
            </div>
            <Row className="g-4">
              {features.map(({ icon: Icon, title, description }) => (
                <Col md={4} key={title}>
                  <Card className="feature-card h-100 p-4 border-0">
                    <div className="icon-pill">
                      <Icon size={28} />
                    </div>
                    <Card.Title className="text-white fw-semibold fs-4">{title}</Card.Title>
                    <Card.Text className="text-soft mt-3">{description}</Card.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="lakehouse" className="section-wrapper">
          <Container>
            <Row className="g-5 align-items-center">
              <Col lg={6}>
                <div className="panel-glass p-5">
                  <h2 className="display-5 fw-bold text-white">Agentic lakehouse fabric</h2>
                  <p className="text-light mt-3">
                    Blend operational data, telemetry, and embeddings into a unified governance plane. AgentProvision delivers ACID compliance, programmable lineage, and governed feature stores for every team.
                  </p>
                  <div className="gradient-divider my-4" />
                  {lakehouseHighlights.map(({ icon: Icon, title, description }) => (
                    <div className="d-flex align-items-start gap-3 mb-3" key={title}>
                      <div className="icon-pill">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h5 className="text-white fw-semibold mb-1">{title}</h5>
                        <p className="mb-0 text-soft">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col lg={6}>
                <div className="glass-card">
                  <h3 className="fs-3 fw-semibold text-white">Data-to-decision pipelines</h3>
                  <p className="text-soft">
                    Deploy certified pipelines that capture telemetry, execute retrieval-augmented reasoning, and trigger policy-controlled actuations.
                  </p>
                  <Row className="g-3 mt-4">
                    {highlights.map(({ title, description, icon: Icon }) => (
                      <Col md={6} key={title}>
                        <div className="feature-card p-4 h-100">
                          <Icon size={26} className="text-primary" />
                          <h5 className="text-white fw-semibold mt-3">{title}</h5>
                          <p className="text-soft mb-0">{description}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="architecture" className="section-wrapper section-contrast">
          <Container>
            <Row className="g-5 align-items-center">
              <Col lg={5}>
                <h2 className="display-5 fw-bold text-white">How the platform is assembled</h2>
                <p className="text-soft mt-3">
                  A three-layer fabric gives enterprise teams confidence from ingestion to action. Each tier is modular so you can start with the integrations you have today and scale into autonomous agents.
                </p>
              </Col>
              <Col lg={7}>
                <Row className="g-4">
                  {architectureLayers.map(({ icon: Icon, title, description }) => (
                    <Col md={4} key={title}>
                      <div className="feature-card h-100 p-4">
                        <div className="icon-pill">
                          <Icon size={26} />
                        </div>
                        <h5 className="text-white fw-semibold mt-2">{title}</h5>
                        <p className="text-soft mb-0">{description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="ai" className="section-wrapper section-contrast">
          <Container>
            <Row className="g-5">
              <Col lg={5}>
                <h2 className="display-5 fw-bold text-white">Operate agents with confidence</h2>
                <p className="text-soft mt-3">
                  Coordinate cross-tenant agent fleets with automated scoring, human-in-the-loop guardrails, and multi-cloud orchestration.
                </p>
              </Col>
              <Col lg={7}>
                <Row className="g-4">
                  {aiHighlights.map(({ icon: Icon, title, description }) => (
                    <Col md={4} key={title}>
                      <div className="feature-card h-100 p-4">
                        <div className="icon-pill">
                          <Icon size={26} />
                        </div>
                        <h5 className="text-white fw-semibold">{title}</h5>
                        <p className="text-soft">{description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="roadmap" className="section-wrapper section-dark">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold text-white">Roadmap</h2>
              <p className="section-subtitle">
                Strategic investments that expand enterprise controls, developer velocity, and observability.
              </p>
            </div>
            <Row className="g-4">
              {roadmap.map(({ icon: Icon, title, description }) => (
                <Col md={4} key={title}>
                  <div className="feature-card h-100 p-4">
                    <div className="icon-pill">
                      <Icon size={26} />
                    </div>
                    <h5 className="text-white fw-semibold">{title}</h5>
                    <p className="text-contrast">{description}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="stories" className="section-wrapper">
          <Container>
            <div className="text-center mb-4">
              <h2 className="display-5 fw-bold">Teams running on AgentProvision</h2>
              <p className="text-muted fs-5">See how operators and data leaders automate decisions and close the loop faster.</p>
            </div>
            <Row className="g-4">
              {testimonials.map(({ quote, author, role }) => (
                <Col md={6} key={author}>
                  <div className="feature-card p-4 h-100">
                    <p className="fs-5 text-contrast">“{quote}”</p>
                    <div className="mt-4">
                      <div className="fw-semibold text-white">{author}</div>
                      <div className="text-soft">{role}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="cta" className="section-wrapper section-highlight">
          <Container>
            <div className="cta-banner p-5 text-white text-center text-md-start shadow-lg">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="display-5 fw-bold">Ready to launch an agentic workflow in weeks?</h2>
                  <p className="mt-3 mb-0 fs-5 text-contrast">
                    Flexible enterprise pricing, white-glove onboarding, and ROI modeling tailored to your use cases.
                  </p>
                </Col>
                <Col md={4} className="mt-4 mt-md-0 text-md-end">
                  <Button size="lg" className="px-5 py-3">
                    Schedule a strategy call
                  </Button>
                </Col>
              </Row>
            </div>
          </Container>
        </section>
      </main>

      <footer className="footer py-4 mt-5">
        <Container className="text-center text-soft">
          © {new Date().getFullYear()} AgentProvision. All rights reserved.
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;