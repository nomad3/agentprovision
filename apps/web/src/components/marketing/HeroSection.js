import { Button, Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FaBolt, FaDatabase, FaRobot } from "react-icons/fa6";
import NeuralCanvas from "../common/NeuralCanvas";

const noop = () => { };

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
                {/* Floating Cards - Data Lake & AI Themed */}
                <div className="floating-card card-1">
                  <div className="card-icon">
                    <FaDatabase />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Data Processed</span>
                    <span className="card-value">2.5 PB</span>
                  </div>
                </div>

                <div className="floating-card card-2">
                  <div className="card-icon">
                    <FaRobot />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Active Agents</span>
                    <span className="card-value">150+</span>
                  </div>
                </div>

                <div className="floating-card card-3">
                  <div className="card-icon">
                    <FaBolt />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Query Speed</span>
                    <span className="card-value">&lt; 50ms</span>
                  </div>
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
