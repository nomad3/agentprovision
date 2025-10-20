import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const IntegrationForm = () => {
  const { connectorId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [config, setConfig] = useState('{}');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const parsedConfig = JSON.parse(config);
      const data = { name, config: parsedConfig, connector_id: connectorId };
      await api.post('/integrations/', data);
      navigate('/integrations');
    } catch (err) {
      setError('Failed to create integration. Please check your config JSON.');
      console.error(err);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Config (JSON)</Form.Label>
        <Form.Control
          as="textarea"
          rows={10}
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit" variant="primary">Create Integration</Button>
    </Form>
  );
};

export default IntegrationForm;
