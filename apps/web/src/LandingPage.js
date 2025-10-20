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
              <Nav.Link href="#features" className="mx-2 text-light">Platform</Nav.Link>
              <Nav.Link href="#lakehouse" className="mx-2 text-light">Lakehouse</Nav.Link>
              <Nav.Link href="#ai" className="mx-2 text-light">Intelligence</Nav.Link>
              <Nav.Link href="#roadmap" className="mx-2 text-light">Roadmap</Nav.Link>
              <Nav.Link href="#stories" className="mx-2 text-light">Stories</Nav.Link>
              <Button href="/register" className="ms-lg-4 px-4 py-2">Book a Demo</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        <HeroSection />

        <section className="py-5" id="metrics" style={{ marginTop: '3rem' }}>
          <Container>
            {metricsChunks.map((group, index) => (
              <Row className="g-4 justify-content-center" key={`metrics-${index}`}>
                {group.map((metric) => (
                  <Col md={4} key={metric.label}>
                    <div className="metric-tile h-100">
                      <div className="text-uppercase text-sm text-light fw-semibold">{metric.label}</div>
                      <h3 className="display-5 fw-bold mt-2 mb-3">{metric.value}</h3>
                      <p className="text-light mb-0">{metric.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            ))}
          </Container>
        </section>

        <section id="features" className="py-5">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold section-heading">Accelerate your agentic data strategy</h2>
              <p className="lead section-subtitle mt-3">
                Ship trusted copilots faster with collaborative workspaces, reusable intelligence mesh, and a governed data fabric.
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
                    <Card.Text className="text-light mt-3">{description}</Card.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="logos" className="py-4">
          <Container>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {logoBadges.map((name) => (
                <span key={name} className="logo-badge">
                  {name}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <section id="lakehouse" className="py-5">
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
                        <p className="mb-0 text-light">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col lg={6}>
                <div className="glass-card">
                  <h3 className="fs-3 fw-semibold text-white">Data-to-decision pipelines</h3>
                  <p className="text-light">
                    Deploy certified pipelines that capture telemetry, execute retrieval-augmented reasoning, and trigger policy-controlled actuations.
                  </p>
                  <Row className="g-3 mt-4">
                    {highlights.map(({ title, description, icon: Icon }) => (
                      <Col md={6} key={title}>
                        <div className="feature-card p-4 h-100">
                          <Icon size={26} className="text-primary" />
                          <h5 className="text-white fw-semibold mt-3">{title}</h5>
                          <p className="text-light mb-0">{description}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="ai" className="py-5">
          <Container>
            <Row className="g-5">
              <Col lg={5}>
                <h2 className="display-5 fw-bold text-white">Operate agents with confidence</h2>
                <p className="text-light mt-3">
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
                        <p className="text-light">{description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="roadmap" className="py-5">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold text-white">Roadmap</h2>
              <p className="section-subtitle text-light">
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
                    <p className="text-light">{description}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="stories" className="py-5">
          <Container>
            <Row className="g-4">
              {testimonials.map(({ quote, author, role }) => (
                <Col md={6} key={author}>
                  <div className="feature-card p-4 h-100">
                    <p className="fs-5 text-light">“{quote}”</p>
                    <div className="mt-4">
                      <div className="fw-semibold text-white">{author}</div>
                      <div className="text-light">{role}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="cta" className="py-5">
          <Container>
            <div className="cta-banner p-5 text-white text-center text-md-start">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="display-5 fw-bold">Build your agentic program on a trusted lakehouse</h2>
                  <p className="mt-3 mb-0 fs-5">
                    Partner with our architects to launch your first governed copilot in weeks, not quarters.
                  </p>
                </Col>
                <Col md={4} className="mt-4 mt-md-0 text-md-end">
                  <Button size="lg" className="px-5 py-3">
                    Talk with an architect
                  </Button>
                </Col>
              </Row>
            </div>
          </Container>
        </section>
      </main>

      <footer className="footer py-4 mt-5">
        <Container className="text-center text-light">
          © {new Date().getFullYear()} AgentProvision. All rights reserved.
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;