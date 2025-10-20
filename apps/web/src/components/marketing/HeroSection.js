import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { heroHighlights } from './data';

const noop = () => {};

const HeroSection = ({ onPrimaryCta = noop, onSecondaryCta = noop }) => {
  return (
    <section className="hero-section text-white pt-5 pb-4" id="hero">
      <Container className="hero-content py-5">
        <Row className="align-items-center gy-5">
          <Col lg={7} className="text-center text-lg-start pe-lg-5">
            <span className="badge-glow">Unified data access</span>
            <h1 className="display-2 fw-bold mt-4 mb-3 section-heading">
              Turn your lakehouse into actions with agentic AI
            </h1>
            <p className="lead text-soft mt-3 mb-3">
              AgentProvision connects warehouses, lakes, and SaaS apps so every team can explore trusted data products without waiting on ETL tickets.
            </p>
            <p className="text-subtle mb-0">
              Auto-map schemas, publish semantic metrics, and let AI agents orchestrate workflows across finance, revenue, and operations tools.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-lg-start mt-5">
              <Button size="lg" className="px-5 py-3" onClick={onPrimaryCta}>
                Launch interactive demo
              </Button>
              <Button
                size="lg"
                variant="outline-light"
                className="px-5 py-3"
                onClick={onSecondaryCta}
              >
                Review architecture brief
              </Button>
            </div>
            <div className="text-subtle mt-3">
              Connect Snowflake, BigQuery, Salesforce, and more in under 30 minutes
            </div>
          </Col>
          <Col lg={5}>
            <div className="hero-grid">
              <div className="hero-spotlight">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-soft text-uppercase" style={{ letterSpacing: '0.12em', fontSize: '0.72rem' }}>
                    Why teams choose AgentProvision
                  </span>
                  <span className="badge-glow">Governed by design</span>
                </div>
                {heroHighlights.map(({ icon: Icon, title, description }) => (
                  <div className="hero-highlight" key={title}>
                    <div className="icon-pill-sm flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="hero-highlight-title">{title}</div>
                      <p className="text-subtle mb-0">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
