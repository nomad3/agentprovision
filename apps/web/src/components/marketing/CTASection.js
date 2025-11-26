import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaPlay } from "react-icons/fa";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section py-5">
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="text-center text-lg-start mb-4 mb-lg-0">
            <h2 className="display-4 fw-bold text-white mb-3">
              Ready to transform your team?
            </h2>
            <p className="lead text-soft mb-4">
              Join thousands of teams already using AI to make smarter data
              decisions every day.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-lg-start">
              <Button
                size="lg"
                className="px-5 py-3 cta-primary"
                onClick={() => navigate("/login")}
              >
                <FaPlay className="me-2" />
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline-light"
                className="px-5 py-3 cta-secondary"
                onClick={() => navigate("/login")}
              >
                Schedule Demo
                <FaArrowRight className="ms-2" />
              </Button>
            </div>
            <div className="trust-badges mt-4">
              <span className="badge-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 11H7v2h2v-2zm4 0H11v2h2v-2zm0-4H11v2h2V7zm0-4H11v2h2V3zM9 3H7v2h2V3zm4 0h-2v2h2V3z" />
                </svg>
                SOC 2 Compliant
              </span>
              <span className="badge-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1L3 5v6c0 1.66 1.34 3 3 3h6c1.66 0 3-1.34 3-3V5l-9-4z" />
                  <path d="M12 11v8l9-4v-6l-9 4z" />
                </svg>
                GDPR Ready
              </span>
              <span className="badge-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41 1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Enterprise Security
              </span>
            </div>
          </Col>
          <Col lg={6}>
            <div className="cta-visual">
              <div className="cta-stats">
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">4.9★</div>
                  <div className="stat-label">User Rating</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CTASection;
