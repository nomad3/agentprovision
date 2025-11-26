import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FaRocket, FaChartLine, FaUsers } from "react-icons/fa";
import NeuralCanvas from "../common/NeuralCanvas";

const noop = () => {};

const HeroSection = ({ onPrimaryCta = noop, onSecondaryCta = noop }) => {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <section className="hero-section text-white pt-5 pb-4" id="hero">
      <NeuralCanvas />
      <div className="hero-overlay" />
      <Container className="hero-content py-5">
        <Row className="align-items-center gy-5">
          <Col lg={6} className="text-center text-lg-start pe-lg-5">
            <span className="badge-glow">AI-Powered Data Platform</span>
            <h1 className="display-2 fw-bold mt-4 mb-3 section-heading">
              Give your entire team data superpowers
            </h1>
            <p className="lead text-soft mt-3 mb-4">
              Transform how your team works with data. Ask questions in plain
              language, get instant answers.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-lg-start mt-4">
              <Button size="lg" className="px-5 py-3" onClick={onPrimaryCta}>
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline-light"
                className="px-5 py-3"
                onClick={onSecondaryCta}
              >
                Watch Demo
              </Button>
            </div>
          </Col>
          <Col lg={6}>
            <div className="hero-visual">
              <div className="floating-cards">
                <div className="floating-card card-1">
                  <div className="card-icon">
                    <FaChartLine />
                  </div>
                  <div className="card-title">Real-time Analytics</div>
                  <div className="card-value">+47%</div>
                  <div className="card-label">Faster Decisions</div>
                </div>

                <div className="floating-card card-2">
                  <div className="card-icon">
                    <FaUsers />
                  </div>
                  <div className="card-title">Team Collaboration</div>
                  <div className="card-value">12x</div>
                  <div className="card-label">More Insights</div>
                </div>

                <div className="floating-card card-3">
                  <div className="card-icon">
                    <FaRocket />
                  </div>
                  <div className="card-title">Time Saved</div>
                  <div className="card-value">8hrs</div>
                  <div className="card-label">Per Week</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
