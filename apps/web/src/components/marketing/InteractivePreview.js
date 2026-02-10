import { useEffect, useState } from 'react';
import { Badge, Button, Col, Container, ProgressBar, Row } from 'react-bootstrap';
import { FaBrain, FaDatabase, FaPlay, FaRobot, FaStop, FaTerminal } from 'react-icons/fa';
import PremiumCard from '../common/PremiumCard';

const InteractivePreview = () => {
  const [activeAgents, setActiveAgents] = useState(2);
  const [logs, setLogs] = useState([
    { time: '10:42:01', source: 'Orchestrator', message: 'Initializing multi-agent workflow...' },
    { time: '10:42:02', source: 'DataAgent', message: 'Connecting to Snowflake warehouse...' },
    { time: '10:42:03', source: 'DataAgent', message: 'Querying customer_churn_prediction table...' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(45);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        setProgress(prev => {
          if (prev >= 100) {
            setIsRunning(false);
            return 0;
          }
          return prev + 5;
        });

        const newLog = generateRandomLog();
        setLogs(prev => [...prev.slice(-4), newLog]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isRunning]);

  const generateRandomLog = () => {
    const sources = ['AnalystAgent', 'CoderAgent', 'ReviewerAgent', 'Orchestrator'];
    const messages = [
      'Analyzing data patterns...',
      'Generating Python visualization code...',
      'Validating output against schema...',
      'Optimizing query performance...',
      'Updating knowledge graph...',
      'Syncing with vector store...',
    ];
    const now = new Date();
    return {
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    };
  };

  const toggleRun = () => {
    setIsRunning(!isRunning);
    if (!isRunning) setProgress(0);
  };

  return (
    <section className="py-5 position-relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, #1e2228 0%, #13171c 100%)' }}>
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{ opacity: 0.1, backgroundImage: 'radial-gradient(#0cd18e 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <Container className="position-relative z-2">
        <div className="text-center mb-5">
          <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill bg-opacity-25 text-primary border border-primary border-opacity-25">
            LIVE PREVIEW
          </Badge>
          <h2 className="display-5 fw-bold text-white mb-3">
            See <span className="gradient-text">ServiceTsunami</span> in Action
          </h2>
          <p className="text-soft lead mx-auto" style={{ maxWidth: '600px' }}>
            Orchestrate complex multi-agent workflows with a powerful, intuitive interface.
          </p>
        </div>

        <div className="perspective-container" style={{ perspective: '2000px' }}>
          <div className="dashboard-mockup" style={{
            transform: 'rotateX(5deg)',
            transition: 'transform 0.5s ease',
            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)'
          }}>
            <PremiumCard className="p-0 overflow-hidden border-secondary border-opacity-25" style={{ background: 'rgba(13, 17, 23, 0.95)' }}>
              {/* Mockup Header */}
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-50">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></div>
                  <div className="rounded-circle bg-warning" style={{ width: '10px', height: '10px' }}></div>
                  <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></div>
                </div>
                <div className="text-soft small font-monospace">agent-orchestration-hub</div>
                <div className="d-flex gap-3">
                  <FaRobot className="text-soft" />
                  <FaBrain className="text-soft" />
                </div>
              </div>

              <Row className="g-0" style={{ minHeight: '500px' }}>
                {/* Mockup Sidebar */}
                <Col md={2} className="border-end border-secondary border-opacity-25 bg-dark bg-opacity-25 p-3 d-none d-md-block">
                  <div className="d-flex flex-column gap-3">
                    <div className="p-2 rounded bg-primary bg-opacity-10 text-primary fw-semibold d-flex align-items-center gap-2">
                      <FaRobot /> Agents
                    </div>
                    <div className="p-2 rounded text-soft d-flex align-items-center gap-2 hover-bg-dark">
                      <FaDatabase /> Data
                    </div>
                    <div className="p-2 rounded text-soft d-flex align-items-center gap-2 hover-bg-dark">
                      <FaBrain /> Memory
                    </div>
                    <div className="p-2 rounded text-soft d-flex align-items-center gap-2 hover-bg-dark">
                      <FaTerminal /> Logs
                    </div>
                  </div>
                </Col>

                {/* Mockup Main Content */}
                <Col md={10} className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="text-white mb-0">Financial Analysis Workflow</h4>
                    <Button
                      variant={isRunning ? "outline-danger" : "primary"}
                      size="sm"
                      onClick={toggleRun}
                      className="d-flex align-items-center gap-2"
                    >
                      {isRunning ? <><FaStop /> Stop Workflow</> : <><FaPlay /> Run Workflow</>}
                    </Button>
                  </div>

                  <Row className="g-4 mb-4">
                    <Col md={4}>
                      <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                        <div className="text-soft small text-uppercase mb-2">Active Agents</div>
                        <div className="d-flex align-items-end gap-2">
                          <h2 className="text-white mb-0">{activeAgents}</h2>
                          <span className="text-success small mb-1">● Online</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                        <div className="text-soft small text-uppercase mb-2">Tasks Completed</div>
                        <div className="d-flex align-items-end gap-2">
                          <h2 className="text-white mb-0">1,284</h2>
                          <span className="text-primary small mb-1">+12% today</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                        <div className="text-soft small text-uppercase mb-2">System Load</div>
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <ProgressBar now={isRunning ? 75 : 25} variant="info" className="flex-grow-1" style={{ height: '8px' }} />
                          <span className="text-white small">{isRunning ? '75%' : '25%'}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25 font-monospace">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-soft small text-uppercase">Live Execution Logs</span>
                      <Badge bg="success" className="bg-opacity-25 text-success">Connected</Badge>
                    </div>
                    <div className="d-flex flex-column gap-2" style={{ height: '200px', overflow: 'hidden' }}>
                      {logs.map((log, idx) => (
                        <div key={idx} className="d-flex gap-3 text-small animate-slide-in">
                          <span className="text-muted">{log.time}</span>
                          <span className={`fw-bold ${log.source === 'Orchestrator' ? 'text-primary' : 'text-info'}`} style={{ minWidth: '100px' }}>
                            {log.source}
                          </span>
                          <span className="text-light">{log.message}</span>
                        </div>
                      ))}
                      {isRunning && (
                        <div className="d-flex gap-3 text-small">
                          <span className="text-muted">...</span>
                          <span className="text-soft fst-italic">Processing next step...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </PremiumCard>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default InteractivePreview;
