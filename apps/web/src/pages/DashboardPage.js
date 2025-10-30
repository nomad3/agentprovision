import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { FaChartBar, FaDatabase, FaRobot, FaComments } from 'react-icons/fa';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { getDashboardStats } from '../services/analytics';

const DashboardPage = () => {
  const { user } = useAuth();
  const viewerEmail = user?.email ?? 'demo@agentprovision.ai';

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="danger">{error}</Alert>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <Alert variant="warning">No dashboard data available</Alert>
      </Layout>
    );
  }

  const { overview, activity, agents, datasets, recent_sessions } = dashboardData;

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h2 className="mb-1">Analytics Command Center</h2>
          <p className="text-muted mb-0">
            Real-time platform metrics and intelligence from your data & AI operations.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark">{viewerEmail}</Badge>
          <Badge bg="success" text="white">
            Live data
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaRobot size={20} />
                </div>
                <Badge bg="primary">AI Agents</Badge>
              </div>
              <h6 className="text-muted mb-1">Active AI Agents</h6>
              <div className="display-6 fw-bold">{overview.total_agents}</div>
              <div className="mt-2 small text-info">{overview.total_deployments} deployments</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaComments size={20} />
                </div>
                <Badge bg="success">Chat Activity</Badge>
              </div>
              <h6 className="text-muted mb-1">Total Chat Messages</h6>
              <div className="display-6 fw-bold">{activity.total_messages}</div>
              <div className="mt-2 small text-success">{activity.recent_messages_7d} last 7 days</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaDatabase size={20} />
                </div>
                <Badge bg="info">Data Platform</Badge>
              </div>
              <h6 className="text-muted mb-1">Active Datasets</h6>
              <div className="display-6 fw-bold">{overview.total_datasets}</div>
              <div className="mt-2 small text-info">{activity.dataset_rows_total.toLocaleString()} total rows</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaChartBar size={20} />
                </div>
                <Badge bg="warning" text="dark">Integrations</Badge>
              </div>
              <h6 className="text-muted mb-1">Data Sources & Pipelines</h6>
              <div className="display-6 fw-bold">{overview.total_data_sources}</div>
              <div className="mt-2 small text-warning">{overview.total_pipelines} active pipelines</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Platform Overview</span>
              <Badge bg="secondary">Metrics</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent px-0 py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">Agent Kits Available</h6>
                      <p className="text-muted mb-0 small">Pre-configured AI agent templates ready for deployment</p>
                    </div>
                    <Badge bg="primary">{overview.total_agent_kits}</Badge>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent px-0 py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">Vector Stores</h6>
                      <p className="text-muted mb-0 small">RAG-enabled knowledge bases for semantic search</p>
                    </div>
                    <Badge bg="info">{overview.total_vector_stores}</Badge>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent px-0 py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">Tools & Integrations</h6>
                      <p className="text-muted mb-0 small">Connected tools available for agent workflows</p>
                    </div>
                    <Badge bg="success">{overview.total_tools}</Badge>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Recent Chat Activity</span>
              <Badge bg="secondary">Sessions</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              {recent_sessions && recent_sessions.length > 0 ? (
                <ListGroup variant="flush">
                  {recent_sessions.map((session) => (
                    <ListGroup.Item key={session.id} className="bg-transparent px-0 py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ flex: 1 }}>
                          <h6 className="mb-1">{session.title}</h6>
                          <p className="text-muted mb-0 small">
                            {session.message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge bg="info">{session.message_count}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted text-center py-4">No recent chat sessions</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">AI Agents & Deployments</span>
              <Badge bg="secondary">Agents</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              {agents && agents.length > 0 ? (
                <Table hover responsive borderless className="mb-0 align-middle">
                  <thead className="text-muted">
                    <tr>
                      <th>Agent Name</th>
                      <th>Deployment Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.name}>
                        <td className="fw-semibold">{agent.name}</td>
                        <td>
                          <Badge bg="primary">{agent.deployment_count}</Badge>
                        </td>
                        <td>
                          <Badge bg={agent.deployment_count > 0 ? "success" : "secondary"}>
                            {agent.deployment_count > 0 ? "Deployed" : "Ready"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-4">No agents configured</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Datasets</span>
              <Badge bg="secondary">Data</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              {datasets && datasets.length > 0 ? (
                <ListGroup variant="flush">
                  {datasets.map((dataset) => (
                    <ListGroup.Item key={dataset.id} className="bg-transparent px-0 py-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div style={{ flex: 1 }}>
                          <h6 className="mb-1">{dataset.name}</h6>
                          <p className="text-muted small mb-0">
                            {dataset.rows.toLocaleString()} rows • {new Date(dataset.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge bg="info">{dataset.rows}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted text-center py-4">No datasets available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default DashboardPage;
