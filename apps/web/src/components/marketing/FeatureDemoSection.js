import { useState } from 'react';
import { Col, Container, Nav, Row, Tab } from 'react-bootstrap';
import { FaBrain, FaComments, FaRobot } from 'react-icons/fa';
import AnimatedSection from '../common/AnimatedSection';

const features = [
  {
    key: 'orchestration',
    title: 'Agent Orchestration',
    icon: FaRobot,
    description: 'Visually design and deploy complex multi-agent workflows in minutes.',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-typing-code-on-computer-5270/1080p.mp4', // Placeholder
  },
  {
    key: 'memory',
    title: 'Memory Systems',
    icon: FaBrain,
    description: 'Inspect and manage the semantic knowledge graph that powers your agents.',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-software-developer-working-on-code-5268/1080p.mp4', // Placeholder
  },
  {
    key: 'chat',
    title: 'Interactive Chat',
    icon: FaComments,
    description: 'Collaborate with your agents in real-time with rich context awareness.',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-coding-on-laptop-5262/1080p.mp4', // Placeholder
  },
];

const FeatureDemoSection = () => {
  const [activeTab, setActiveTab] = useState('orchestration');

  return (
    <section className="section-wrapper section-dark overflow-hidden">
      <Container>
        <AnimatedSection animation="fade-in">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold gradient-text">
              Platform Tour
            </h2>
            <p className="section-subtitle">
              See how AgentProvision empowers your workflow
            </p>
          </div>
        </AnimatedSection>

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row className="g-5 align-items-center">
            <Col lg={4}>
              <div className="d-flex flex-column gap-3">
                {features.map((feature) => (
                  <Nav.Link
                    key={feature.key}
                    eventKey={feature.key}
                    className={`feature-tab p-4 rounded-4 border transition-all ${activeTab === feature.key
                        ? 'bg-white bg-opacity-10 border-primary border-opacity-50 shadow-lg'
                        : 'bg-transparent border-transparent text-soft hover-bg-dark'
                      }`}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className={`p-2 rounded-circle ${activeTab === feature.key ? 'bg-primary text-white' : 'bg-dark text-soft'}`}>
                        <feature.icon size={20} />
                      </div>
                      <h5 className={`mb-0 fw-semibold ${activeTab === feature.key ? 'text-white' : 'text-soft'}`}>
                        {feature.title}
                      </h5>
                    </div>
                    <p className={`mb-0 small ${activeTab === feature.key ? 'text-light' : 'text-muted'}`}>
                      {feature.description}
                    </p>
                  </Nav.Link>
                ))}
              </div>
            </Col>

            <Col lg={8}>
              <Tab.Content>
                {features.map((feature) => (
                  <Tab.Pane key={feature.key} eventKey={feature.key} className="position-relative">
                    <AnimatedSection animation="scale-up">
                      <div className="video-frame p-2 rounded-4 bg-dark border border-secondary border-opacity-25 shadow-lg position-relative">
                        {/* Browser Chrome Mockup */}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 border-bottom border-secondary border-opacity-25 mb-0 bg-black bg-opacity-25 rounded-top-3">
                          <div className="d-flex gap-1">
                            <div className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></div>
                            <div className="rounded-circle bg-warning" style={{ width: '10px', height: '10px' }}></div>
                            <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></div>
                          </div>
                          <div className="mx-auto bg-dark bg-opacity-50 px-4 py-1 rounded-pill text-muted small font-monospace" style={{ fontSize: '10px' }}>
                            app.agentprovision.com/{feature.key}
                          </div>
                        </div>

                        {/* Video Container */}
                        <div className="ratio ratio-16x9 bg-black rounded-bottom-3 overflow-hidden">
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="object-fit-cover"
                            poster="/assets/video-poster.jpg" // Fallback
                          >
                            <source src={feature.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>

                          {/* Overlay Gradient */}
                          <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-gradient-to-t from-black to-transparent" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                            <div className="d-flex align-items-center gap-2 text-white">
                              <span className="badge bg-primary bg-opacity-75 rounded-pill px-3">Demo</span>
                              <span className="small opacity-75">Actual platform footage</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </section>
  );
};

export default FeatureDemoSection;
