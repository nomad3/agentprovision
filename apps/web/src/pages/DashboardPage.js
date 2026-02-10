import { useEffect, useState } from 'react';
import { Alert, Badge, Col, ListGroup, Row, Spinner, Table } from 'react-bootstrap';
import { FaChartBar, FaComments, FaDatabase, FaRobot } from 'react-icons/fa';
import { useAuth } from '../App';
import PremiumCard from '../components/common/PremiumCard';
import QuickStartSection from '../components/dashboard/QuickStartSection';
import DataSourceWizard from '../components/datasource/DataSourceWizard';
import Layout from '../components/Layout';
import EnhancedUploadModal from '../components/upload/EnhancedUploadModal';
import { getDashboardStats } from '../services/analytics';

const DashboardPage = () => {
  const { user } = useAuth();
  const viewerEmail = user?.email ?? 'demo@servicetsunami.com';

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

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
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-soft">Loading dashboard...</p>
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
      <QuickStartSection
        onUploadClick={() => setShowUploadModal(true)}
        onConnectClick={() => setShowConnectModal(true)}
      />

      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h2 className="mb-1 fw-bold text-white">Analytics Command Center</h2>
          <p className="text-soft mb-0">
            Real-time platform metrics and intelligence from your data & AI operations.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark" className="border border-secondary text-soft">{viewerEmail}</Badge>
          <Badge bg="success" className="bg-opacity-25 text-success border border-success">
            Live data
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        <Col md={3}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="icon-pill-sm">
                <FaRobot size={20} />
              </div>
              <Badge bg="primary" className="bg-opacity-25 text-primary border border-primary">AI Agents</Badge>
            </div>
            <h6 className="text-soft mb-1">Active AI Agents</h6>
            <div className="display-6 fw-bold text-white">{overview.total_agents}</div>
            <div className="mt-2 small text-info">{overview.total_deployments} deployments</div>
          </PremiumCard>
        </Col>

        <Col md={3}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="icon-pill-sm">
                <FaComments size={20} />
              </div>
              <Badge bg="success" className="bg-opacity-25 text-success border border-success">Chat Activity</Badge>
            </div>
            <h6 className="text-soft mb-1">Total Chat Messages</h6>
            <div className="display-6 fw-bold text-white">{activity.total_messages}</div>
            <div className="mt-2 small text-success">{activity.recent_messages_7d} last 7 days</div>
          </PremiumCard>
        </Col>

        <Col md={3}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="icon-pill-sm">
                <FaDatabase size={20} />
              </div>
              <Badge bg="info" className="bg-opacity-25 text-info border border-info">Data Platform</Badge>
            </div>
            <h6 className="text-soft mb-1">Active Datasets</h6>
            <div className="display-6 fw-bold text-white">{overview.total_datasets}</div>
            <div className="mt-2 small text-info">{activity.dataset_rows_total.toLocaleString()} total rows</div>
          </PremiumCard>
        </Col>

        <Col md={3}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="icon-pill-sm">
                <FaChartBar size={20} />
              </div>
              <Badge bg="warning" className="bg-opacity-25 text-warning border border-warning">Integrations</Badge>
            </div>
            <h6 className="text-soft mb-1">Data Sources & Pipelines</h6>
            <div className="display-6 fw-bold text-white">{overview.total_data_sources}</div>
            <div className="mt-2 small text-warning">{overview.total_pipelines} active pipelines</div>
          </PremiumCard>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={6}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-semibold text-white fs-5">Platform Overview</span>
              <Badge bg="secondary" className="bg-opacity-25 text-light border border-secondary">Metrics</Badge>
            </div>
            <ListGroup variant="flush">
              <ListGroup.Item className="bg-transparent px-0 py-3 border-secondary border-opacity-25">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1 text-white">Agent Kits Available</h6>
                    <p className="text-muted mb-0 small">Pre-configured AI agent templates ready for deployment</p>
                  </div>
                  <Badge bg="primary" pill>{overview.total_agent_kits}</Badge>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent px-0 py-3 border-secondary border-opacity-25">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1 text-white">Vector Stores</h6>
                    <p className="text-muted mb-0 small">RAG-enabled knowledge bases for semantic search</p>
                  </div>
                  <Badge bg="info" pill>{overview.total_vector_stores}</Badge>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent px-0 py-3 border-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1 text-white">Tools & Integrations</h6>
                    <p className="text-muted mb-0 small">Connected tools available for agent workflows</p>
                  </div>
                  <Badge bg="success" pill>{overview.total_tools}</Badge>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </PremiumCard>
        </Col>

        <Col lg={6}>
          <PremiumCard className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-semibold text-white fs-5">Recent Chat Activity</span>
              <Badge bg="secondary" className="bg-opacity-25 text-light border border-secondary">Sessions</Badge>
            </div>
            {recent_sessions && recent_sessions.length > 0 ? (
              <ListGroup variant="flush">
                {recent_sessions.map((session, index) => (
                  <ListGroup.Item
                    key={session.id}
                    className={`bg-transparent px-0 py-3 ${index !== recent_sessions.length - 1 ? 'border-secondary border-opacity-25' : 'border-0'}`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: 1 }}>
                        <h6 className="mb-1 text-white">{session.title}</h6>
                        <p className="text-muted mb-0 small">
                          {session.message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge bg="info" pill>{session.message_count}</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted text-center py-4">No recent chat sessions</p>
            )}
          </PremiumCard>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={7}>
          <PremiumCard>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-semibold text-white fs-5">AI Agents & Deployments</span>
              <Badge bg="secondary" className="bg-opacity-25 text-light border border-secondary">Agents</Badge>
            </div>
            {agents && agents.length > 0 ? (
              <Table hover responsive borderless className="mb-0 align-middle text-soft">
                <thead className="text-muted border-bottom border-secondary border-opacity-25">
                  <tr>
                    <th>Agent Name</th>
                    <th>Deployment Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.name}>
                      <td className="fw-semibold text-white">{agent.name}</td>
                      <td>
                        <Badge bg="primary" className="bg-opacity-25 text-primary border border-primary">{agent.deployment_count}</Badge>
                      </td>
                      <td>
                        <Badge bg={agent.deployment_count > 0 ? "success" : "secondary"} className={agent.deployment_count > 0 ? "bg-opacity-25 text-success border border-success" : "bg-opacity-25 text-secondary border border-secondary"}>
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
          </PremiumCard>
        </Col>

        <Col lg={5}>
          <PremiumCard>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-semibold text-white fs-5">Datasets</span>
              <Badge bg="secondary" className="bg-opacity-25 text-light border border-secondary">Data</Badge>
            </div>
            {datasets && datasets.length > 0 ? (
              <ListGroup variant="flush">
                {datasets.map((dataset, index) => (
                  <ListGroup.Item
                    key={dataset.id}
                    className={`bg-transparent px-0 py-3 ${index !== datasets.length - 1 ? 'border-secondary border-opacity-25' : 'border-0'}`}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div style={{ flex: 1 }}>
                        <h6 className="mb-1 text-white">{dataset.name}</h6>
                        <p className="text-muted small mb-0">
                          {dataset.rows.toLocaleString()} rows • {new Date(dataset.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge bg="info" className="bg-opacity-25 text-info border border-info">{dataset.rows}</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted text-center py-4">No datasets available</p>
            )}
          </PremiumCard>
        </Col>
      </Row>

      <EnhancedUploadModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onSuccess={() => {
          // Refresh quick start section
          window.location.reload(); // Simple approach, or lift state up
        }}
      />

      <DataSourceWizard
        show={showConnectModal}
        onHide={() => setShowConnectModal(false)}
      />
    </Layout>
  );
};

export default DashboardPage;
