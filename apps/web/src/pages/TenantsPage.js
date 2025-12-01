import { useEffect, useState } from 'react';
import { Alert, Badge, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { Building, CalendarCheck, Person } from 'react-bootstrap-icons';
import { useAuth } from '../App';
import Layout from '../components/Layout';
import api from '../services/api';
import './TenantsPage.css';

const TenantsPage = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);

        // Get current user (includes tenant info)
        const userResponse = await api.get('/users/me');
        setTenant(userResponse.data.tenant);

        // Get dashboard stats for tenant metrics
        const statsResponse = await api.get('/analytics/dashboard');
        setStats(statsResponse.data);

        setError(null);
      } catch (err) {
        setError('Failed to load tenant data. Please try again.');
        console.error('Error fetching tenant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading tenant information...</p>
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

  return (
    <Layout>
      <div className="tenants-page">
        <div className="page-header">
          <h1 className="page-title">
            <Building className="text-primary" />
            Organization
          </h1>
          <p className="page-subtitle">
            Manage your organization's details and view usage statistics
          </p>
        </div>

        {/* Tenant Overview */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="tenant-card h-100">
              <Card.Body className="card-body-custom">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="icon-pill-sm">
                    <Building size={20} />
                  </div>
                  <Badge bg="primary" className="px-3 py-2">Tenant</Badge>
                </div>
                <h6 className="text-muted mb-1">Organization Name</h6>
                <div className="h4 fw-bold text-white mb-2">{tenant?.name || 'My Organization'}</div>
                <div className="small text-muted text-truncate">ID: {tenant?.id}</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="tenant-card h-100">
              <Card.Body className="card-body-custom">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="icon-pill-sm">
                    <Person size={20} />
                  </div>
                  <Badge bg="success" className="px-3 py-2">Active User</Badge>
                </div>
                <h6 className="text-muted mb-1">Logged in as</h6>
                <div className="h4 fw-bold text-white mb-2">{user?.full_name || 'User'}</div>
                <div className="small text-muted">{user?.email}</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="tenant-card h-100">
              <Card.Body className="card-body-custom">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="icon-pill-sm">
                    <CalendarCheck size={20} />
                  </div>
                  <Badge bg="info" className="px-3 py-2">Status</Badge>
                </div>
                <h6 className="text-muted mb-1">Account Status</h6>
                <div className="h4 fw-bold text-success mb-2">Active</div>
                <div className="small text-success">All systems operational</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Platform Usage Statistics */}
        {stats && (
          <Card className="tenant-card mb-4">
            <div className="card-header-transparent">
              <h5 className="mb-0 text-white">Platform Usage Statistics</h5>
            </div>
            <Card.Body className="card-body-custom">
              <Row>
                <Col md={6}>
                  <Table borderless className="stats-table mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">AI Agents</td>
                        <td className="text-end fw-bold">{stats.overview.total_agents}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Active Deployments</td>
                        <td className="text-end fw-bold">{stats.overview.total_deployments}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Datasets</td>
                        <td className="text-end fw-bold">{stats.overview.total_datasets}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Agent Kits</td>
                        <td className="text-end fw-bold">{stats.overview.total_agent_kits}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Vector Stores</td>
                        <td className="text-end fw-bold">{stats.overview.total_vector_stores}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless className="stats-table mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Chat Sessions</td>
                        <td className="text-end fw-bold">{stats.overview.total_chat_sessions}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Messages</td>
                        <td className="text-end fw-bold">{stats.activity.total_messages}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Data Sources</td>
                        <td className="text-end fw-bold">{stats.overview.total_data_sources}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Data Pipelines</td>
                        <td className="text-end fw-bold">{stats.overview.total_pipelines}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Tools</td>
                        <td className="text-end fw-bold">{stats.overview.total_tools}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Tenant Information */}
        <Card className="tenant-card">
          <div className="card-header-transparent">
            <h5 className="mb-0 text-white">Tenant Details</h5>
          </div>
          <Card.Body className="card-body-custom">
            <Alert variant="info" className="info-alert mb-4">
              <strong>Multi-Tenant Isolation:</strong> All your data is completely isolated from other tenants.
              Your agents, datasets, chat sessions, and configurations are private to your organization.
            </Alert>

            <div>
              <h6 className="text-white mb-3">What is a Tenant?</h6>
              <p className="text-muted mb-0">
                A tenant represents your organization in AgentProvision. All users in your organization
                share access to the same AI agents, datasets, and configurations. Data is completely
                isolated between tenants for security and privacy.
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default TenantsPage;
