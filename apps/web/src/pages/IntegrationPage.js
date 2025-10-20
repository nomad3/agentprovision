import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const IntegrationPage = () => {
  const { id } = useParams();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntegration = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/integrations/${id}`);
        setIntegration(response.data);
      } catch (err) {
        setError('Failed to fetch integration details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegration();
  }, [id]);

  return (
    <Layout>
      {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
      {error && <Alert variant="danger">{error}</Alert>}

      {integration && (
        <Card>
          <Card.Header as="h2">{integration.name}</Card.Header>
          <Card.Body>
            <Card.Text>
              <strong>ID:</strong> {integration.id}<br />
              <strong>Connector:</strong> {integration.connector.name}<br />
              <strong>Config:</strong> <pre>{JSON.stringify(integration.config, null, 2)}</pre>
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </Layout>
  );
};

export default IntegrationPage;
