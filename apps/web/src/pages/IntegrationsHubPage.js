import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ConnectorCard from '../components/ConnectorCard';

const IntegrationsHubPage = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        setLoading(true);
        // This endpoint needs to be created in the backend
        const response = await api.get('/integrations/available'); 
        setConnectors(response.data);
        console.log("Fetched connectors:", response.data); // Debugging line
      } catch (err) {
        setError('Failed to fetch available connectors.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectors();
  }, []);

  return (
    <Layout>
      <h2 className="mb-4">Integrations Hub</h2>
      <p className="text-muted mb-4">Discover and configure integrations to bring your data into AgentProvision.</p>

      {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        {connectors.map((connector) => (
          <Col md={4} key={connector.id}>
            <ConnectorCard connector={connector} />
          </Col>
        ))}
      </Row>
    </Layout>
  );
};

export default IntegrationsHubPage;