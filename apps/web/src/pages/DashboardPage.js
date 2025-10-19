import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaRobot, FaDatabase, FaCodeBranch, FaBook } from 'react-icons/fa';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../App';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/summary'); // Assuming this endpoint exists
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard summary.');
        console.error('Dashboard summary fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSummary();
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <Alert variant="warning">Please log in to view the dashboard.</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="mb-4">Welcome, {user.email}!</h2>

      {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
      {error && <Alert variant="danger">{error}</Alert>}

      {summary && (
        <Row className="g-4">
          <Col md={3}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaRobot size={30} className="text-primary me-3" />
                  <div>
                    <Card.Title className="mb-0">Total Agents</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{summary.total_agents}</Card.Text>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaDatabase size={30} className="text-success me-3" />
                  <div>
                    <Card.Title className="mb-0">Data Sources</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{summary.total_data_sources}</Card.Text>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaCodeBranch size={30} className="text-info me-3" />
                  <div>
                    <Card.Title className="mb-0">Data Pipelines</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{summary.total_data_pipelines}</Card.Text>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaBook size={30} className="text-warning me-3" />
                  <div>
                    <Card.Title className="mb-0">Notebooks</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{summary.total_notebooks}</Card.Text>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <h3 className="mt-5">Recent Activity</h3>
      <p>Placeholder for recent activity feed.</p>
    </Layout>
  );
};

export default DashboardPage;
