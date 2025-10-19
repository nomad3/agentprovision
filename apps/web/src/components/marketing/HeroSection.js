import React from 'react';
import { Container, Button } from 'react-bootstrap';

const HeroSection = ({ onPrimaryCta, onSecondaryCta }) => {
  return (
    <section className="hero-section text-center text-white py-5" id="hero">
      <Container className="hero-content py-5">
        <span className="badge-glow">Agentic Data Lakehouse</span>
        <h1 className="display-3 fw-bold mt-4 mb-4 section-heading">
          Connect every enterprise signal to autonomous intelligence you can trust
        </h1>
        <p className="lead mx-auto section-subtitle">
          AgentProvision unifies data pipelines, observability, and multi-agent orchestration into a single control plane so you can launch intelligent copilots with governance from day one.
        </p>
        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mt-4">
          <Button size="lg" className="px-5 py-3" onClick={onPrimaryCta}>
            Launch Interactive Demo
          </Button>
          <Button
            size="lg"
            variant="outline-light"
            className="px-5 py-3"
            onClick={onSecondaryCta}
          >
            Explore Architecture Deck
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
