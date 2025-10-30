import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { FaBuilding, FaUsers, FaCalendar } from 'react-icons/fa';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import api from '../services/api';

const TenantsPage = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
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
          <Spinner animation="border" role="status">
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
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h2 className="mb-1">Tenant Information</h2>
          <p className="text-muted mb-0">
            View your organization's details and usage statistics
          </p>
        </div>
        <Badge bg="primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          <FaBuilding className="me-2" />
          {tenant?.name || 'Unknown Tenant'}
        </Badge>
      </div>

      {/* Tenant Overview */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaBuilding size={20} />
                </div>
                <Badge bg="primary">Organization</Badge>
              </div>
              <h6 className="text-muted mb-1">Tenant Name</h6>
              <div className="h4 fw-bold">{tenant?.name || 'N/A'}</div>
              <div className="mt-2 small text-muted">ID: {tenant?.id?.substring(0, 8)}...</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaUsers size={20} />
                </div>
                <Badge bg="success">Current User</Badge>
              </div>
              <h6 className="text-muted mb-1">Logged in as</h6>
              <div className="h4 fw-bold">{user?.full_name || 'User'}</div>
              <div className="mt-2 small text-muted">{user?.email}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-pill-sm">
                  <FaCalendar size={20} />
                </div>
                <Badge bg="info">Status</Badge>
              </div>
              <h6 className="text-muted mb-1">Account Status</h6>
              <div className="h4 fw-bold">
                <Badge bg="success">Active</Badge>
              </div>
              <div className="mt-2 small text-success">All systems operational</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Platform Usage Statistics */}
      {stats && (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Header className="bg-transparent border-0">
            <h5 className="mb-0">Platform Usage Statistics</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Table borderless className="mb-0">
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
                <Table borderless className="mb-0">
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
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-transparent border-0">
          <h5 className="mb-0">Tenant Details</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <strong>Multi-Tenant Isolation:</strong> All your data is completely isolated from other tenants.
            Your agents, datasets, chat sessions, and configurations are private to your organization.
          </Alert>

          <div className="mt-4">
            <h6 className="mb-3">What is a Tenant?</h6>
            <p className="text-muted">
              A tenant represents your organization in AgentProvision. All users in your organization
              share access to the same AI agents, datasets, and configurations. Data is completely
              isolated between tenants for security and privacy.
            </p>
          </div>
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default TenantsPage;
