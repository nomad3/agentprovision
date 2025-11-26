import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaRocket,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaBrain,
  FaGlobe,
} from "react-icons/fa";

const FeaturesSection = () => {
  const features = [
    {
      icon: FaRocket,
      title: "Lightning Fast",
      description: "Get answers in seconds, not days",
    },
    {
      icon: FaChartLine,
      title: "Smart Analytics",
      description: "AI-powered insights automatically",
    },
    {
      icon: FaUsers,
      title: "Team Ready",
      description: "Collaborate seamlessly with your team",
    },
    {
      icon: FaShieldAlt,
      title: "Secure & Compliant",
      description: "Enterprise-grade security built-in",
    },
    {
      icon: FaBrain,
      title: "AI-Powered",
      description: "Advanced ML for intelligent analysis",
    },
    {
      icon: FaGlobe,
      title: "Global Scale",
      description: "Works with data from anywhere",
    },
  ];

  return (
    <section className="features-section py-5">
      <Container>
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold text-white mb-3">
              Everything you need to succeed
            </h2>
            <p className="lead text-soft">
              Powerful features that transform how your team works with data
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          {features.map((feature, index) => (
            <Col md={6} lg={4} key={index} className="mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-description">{feature.description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default FeaturesSection;
