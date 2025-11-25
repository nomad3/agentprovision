import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { llmService } from '../services/llm';

function LLMSettingsPage() {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, modelsData, configsData] = await Promise.all([
        llmService.getProviders(),
        llmService.getModels(),
        llmService.getConfigs(),
      ]);
      setProviders(providersData);
      setModels(modelsData);
      setConfigs(configsData);
    } catch (error) {
      console.error('Failed to load LLM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const speedBadge = (tier) => {
    const colors = { fast: 'success', standard: 'warning', slow: 'secondary' };
    return <Badge bg={colors[tier] || 'secondary'}>{tier}</Badge>;
  };

  const qualityBadge = (tier) => {
    const colors = { best: 'primary', good: 'info', basic: 'secondary' };
    return <Badge bg={colors[tier] || 'secondary'}>{tier}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>LLM Settings</h2>
          <p className="text-muted">Configure AI models and providers</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Providers</Card.Title>
              <div className="display-4 text-primary">{providers.length}</div>
              <p className="text-muted">Active providers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Models</Card.Title>
              <div className="display-4 text-success">{models.length}</div>
              <p className="text-muted">Available models</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Configurations</Card.Title>
              <div className="display-4 text-info">{configs.length}</div>
              <p className="text-muted">Tenant configs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Available Models</span>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Context</th>
                  <th>Speed</th>
                  <th>Quality</th>
                  <th>Cost (per 1K)</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>{model.display_name}</td>
                    <td>
                      {providers.find(p => p.id === model.provider_id)?.display_name || 'Unknown'}
                    </td>
                    <td>{(model.context_window / 1000).toFixed(0)}K</td>
                    <td>{speedBadge(model.speed_tier)}</td>
                    <td>{qualityBadge(model.quality_tier)}</td>
                    <td>
                      ${model.input_cost_per_1k?.toFixed(4)} / ${model.output_cost_per_1k?.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LLMSettingsPage;
