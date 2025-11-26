import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { CpuFill, CheckCircleFill, XCircleFill, EyeFill, EyeSlashFill, KeyFill } from 'react-bootstrap-icons';
import llmService from '../services/llm';

const LLMSettingsPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingProvider, setSavingProvider] = useState(null);
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [saveSuccess, setSaveSuccess] = useState({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await llmService.getProviderStatus();
      setProviders(data);
    } catch (err) {
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (providerName, value) => {
    setApiKeys(prev => ({ ...prev, [providerName]: value }));
    setSaveSuccess(prev => ({ ...prev, [providerName]: false }));
  };

  const handleSaveKey = async (providerName) => {
    const key = apiKeys[providerName];
    if (!key) return;

    try {
      setSavingProvider(providerName);
      await llmService.setProviderKey(providerName, key);
      setSaveSuccess(prev => ({ ...prev, [providerName]: true }));
      setApiKeys(prev => ({ ...prev, [providerName]: '' }));
      await loadProviders();
    } catch (err) {
      setError(`Failed to save ${providerName} key`);
    } finally {
      setSavingProvider(null);
    }
  };

  const toggleShowKey = (providerName) => {
    setShowKeys(prev => ({ ...prev, [providerName]: !prev[providerName] }));
  };

  const getProviderIcon = (name) => {
    const icons = {
      openai: '🤖',
      anthropic: '🧠',
      deepseek: '🔍',
      google: '🌐',
      mistral: '💨'
    };
    return icons[name] || '🔌';
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <CpuFill size={28} className="text-primary me-3" />
        <div>
          <h2 className="mb-0">LLM Providers</h2>
          <p className="text-muted mb-0">Configure API keys for each provider</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row xs={1} md={2} lg={3} className="g-4">
        {providers.map((provider) => (
          <Col key={provider.name}>
            <Card className={`h-100 ${provider.configured ? 'border-success' : 'border-secondary'}`}>
              <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.5rem' }}>
                    {getProviderIcon(provider.name)}
                  </span>
                  <strong>{provider.display_name}</strong>
                </div>
                {provider.configured ? (
                  <Badge bg="success" className="d-flex align-items-center">
                    <CheckCircleFill className="me-1" /> Connected
                  </Badge>
                ) : (
                  <Badge bg="secondary" className="d-flex align-items-center">
                    <XCircleFill className="me-1" /> Not configured
                  </Badge>
                )}
              </Card.Header>
              <Card.Body>
                <Form.Label className="small text-muted">
                  <KeyFill className="me-1" />
                  API Key
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showKeys[provider.name] ? 'text' : 'password'}
                    placeholder={provider.configured ? '••••••••••••' : 'Enter API key'}
                    value={apiKeys[provider.name] || ''}
                    onChange={(e) => handleKeyChange(provider.name, e.target.value)}
                    disabled={savingProvider === provider.name}
                  />
                  <InputGroup.Text
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleShowKey(provider.name)}
                  >
                    {showKeys[provider.name] ? <EyeSlashFill /> : <EyeFill />}
                  </InputGroup.Text>
                </InputGroup>

                {saveSuccess[provider.name] && (
                  <small className="text-success mt-2 d-block">
                    <CheckCircleFill className="me-1" /> Key saved successfully
                  </small>
                )}

                <div className="mt-3 d-grid">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveKey(provider.name)}
                    disabled={!apiKeys[provider.name] || savingProvider === provider.name}
                  >
                    {savingProvider === provider.name ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      'Save Key'
                    )}
                  </button>
                </div>
              </Card.Body>
              <Card.Footer className="text-muted small">
                {provider.is_openai_compatible ? 'OpenAI-compatible API' : 'Native API'}
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default LLMSettingsPage;
