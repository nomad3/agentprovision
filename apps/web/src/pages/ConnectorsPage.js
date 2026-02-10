import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner
} from 'react-bootstrap';
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaPen,
  FaPlay,
  FaPlus,
  FaTrash,
  FaTimesCircle
} from 'react-icons/fa';
import Layout from '../components/Layout';
import connectorService from '../services/connector';

// Connector type configurations
const CONNECTOR_TYPES = {
  snowflake: {
    label: 'Snowflake',
    icon: '❄️',
    fields: [
      { name: 'account', label: 'Account', type: 'text', placeholder: 'xy12345.us-east-1', required: true },
      { name: 'user', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'warehouse', label: 'Warehouse', type: 'text', required: true },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'schema', label: 'Schema', type: 'text', placeholder: 'PUBLIC' }
    ]
  },
  postgres: {
    label: 'PostgreSQL',
    icon: '🐘',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '5432' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'user', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'ssl_mode', label: 'SSL Mode', type: 'select', options: ['disable', 'prefer', 'require'] }
    ]
  },
  mysql: {
    label: 'MySQL',
    icon: '🐬',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '3306' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'user', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true }
    ]
  },
  databricks: {
    label: 'Databricks',
    icon: '⚡',
    fields: [
      { name: 'host', label: 'Workspace URL', type: 'text', placeholder: 'https://xxx.cloud.databricks.com', required: true },
      { name: 'token', label: 'Access Token', type: 'password', required: true },
      { name: 'http_path', label: 'SQL Warehouse HTTP Path', type: 'text', placeholder: '/sql/1.0/warehouses/xxx', required: true }
    ]
  },
  s3: {
    label: 'Amazon S3',
    icon: '📦',
    fields: [
      { name: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' },
      { name: 'access_key', label: 'Access Key ID', type: 'text', required: true },
      { name: 'secret_key', label: 'Secret Access Key', type: 'password', required: true },
      { name: 'prefix', label: 'Path Prefix', type: 'text', placeholder: 'data/' }
    ]
  },
  gcs: {
    label: 'Google Cloud Storage',
    icon: '☁️',
    fields: [
      { name: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { name: 'project_id', label: 'Project ID', type: 'text', required: true },
      { name: 'prefix', label: 'Path Prefix', type: 'text', placeholder: 'data/' }
    ]
  },
  api: {
    label: 'REST API',
    icon: '🔗',
    fields: [
      { name: 'base_url', label: 'Base URL', type: 'text', placeholder: 'https://api.example.com', required: true },
      { name: 'auth_type', label: 'Auth Type', type: 'select', options: ['none', 'api_key', 'bearer'] },
      { name: 'api_key_header', label: 'API Key Header', type: 'text', placeholder: 'X-API-Key' },
      { name: 'api_key', label: 'API Key', type: 'password' }
    ]
  }
};

const ConnectorsPage = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'snowflake', config: {} });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const response = await connectorService.getAll();
      setConnectors(response.data);
    } catch (err) {
      setError('Failed to load connectors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (connector = null) => {
    if (connector) {
      setEditingConnector(connector);
      setFormData({
        name: connector.name,
        description: connector.description || '',
        type: connector.type,
        config: connector.config || {}
      });
    } else {
      setEditingConnector(null);
      setFormData({ name: '', description: '', type: 'snowflake', config: {} });
    }
    setTestResult(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConnector(null);
    setTestResult(null);
    setFormData({ name: '', description: '', type: 'snowflake', config: {} });
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [field]: value }
    }));
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await connectorService.testConnection(formData.type, formData.config);
      setTestResult(response.data);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.detail || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingConnector) {
        await connectorService.update(editingConnector.id, formData);
        setSuccess('Connector updated successfully');
      } else {
        await connectorService.create(formData);
        setSuccess('Connector created successfully');
      }
      handleCloseModal();
      fetchConnectors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save connector');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this connector?')) {
      try {
        await connectorService.delete(id);
        setSuccess('Connector deleted');
        fetchConnectors();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete connector');
        console.error(err);
      }
    }
  };

  const handleTestExisting = async (id) => {
    try {
      setTesting(id);
      await connectorService.testExisting(id);
      setSuccess('Connection test passed!');
      fetchConnectors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success"><FaCheckCircle className="me-1" /> Active</Badge>;
      case 'error':
        return <Badge bg="danger"><FaTimesCircle className="me-1" /> Error</Badge>;
      default:
        return <Badge bg="secondary"><FaExclamationTriangle className="me-1" /> Pending</Badge>;
    }
  };

  const renderConnectorForm = () => {
    const typeConfig = CONNECTOR_TYPES[formData.type];
    if (!typeConfig) return null;

    return (
      <>
        {typeConfig.fields.map((field) => (
          <Form.Group key={field.name} className="mb-3">
            <Form.Label>{field.label}{field.required && <span className="text-danger">*</span>}</Form.Label>
            {field.type === 'select' ? (
              <Form.Select
                value={formData.config[field.name] || ''}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            ) : (
              <Form.Control
                type={field.type}
                placeholder={field.placeholder}
                value={formData.config[field.name] || ''}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </Form.Group>
        ))}
      </>
    );
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><FaDatabase className="me-2" />Data Connectors</h2>
          <p className="text-muted mb-0">Connect to your data sources to sync and analyze data</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-2" />Add Connector
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : connectors.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaCloudUploadAlt size={64} className="text-muted mb-3" />
            <h4>No connectors yet</h4>
            <p className="text-muted">Connect your first data source to start syncing data</p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />Add Your First Connector
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {connectors.map((connector) => (
            <Col key={connector.id} md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span className="fs-3 me-2">{CONNECTOR_TYPES[connector.type]?.icon || '🔌'}</span>
                      <Badge bg="light" text="dark">{CONNECTOR_TYPES[connector.type]?.label || connector.type}</Badge>
                    </div>
                    {getStatusBadge(connector.status)}
                  </div>
                  <Card.Title>{connector.name}</Card.Title>
                  <Card.Text className="text-muted small">
                    {connector.description || 'No description'}
                  </Card.Text>
                  {connector.last_test_at && (
                    <small className="text-muted d-block mb-2">
                      Last tested: {new Date(connector.last_test_at).toLocaleDateString()}
                    </small>
                  )}
                  {connector.last_test_error && (
                    <Alert variant="danger" className="py-1 px-2 small mb-2">
                      {connector.last_test_error.substring(0, 100)}...
                    </Alert>
                  )}
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleTestExisting(connector.id)}
                      disabled={testing === connector.id}
                    >
                      {testing === connector.id ? <Spinner size="sm" animation="border" /> : <FaPlay />}
                      {' '}Test
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleOpenModal(connector)}>
                      <FaPen /> Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(connector.id)}>
                      <FaTrash />
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingConnector ? 'Edit Connector' : 'Add New Connector'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Connector Name<span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Production Snowflake"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Connector Type<span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, config: {} })}
                disabled={!!editingConnector}
              >
                {Object.entries(CONNECTOR_TYPES).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <hr />
            <h6 className="mb-3">Connection Settings</h6>
            {renderConnectorForm()}

            {testResult && (
              <Alert variant={testResult.success ? 'success' : 'danger'} className="mt-3">
                {testResult.success ? <FaCheckCircle className="me-2" /> : <FaTimesCircle className="me-2" />}
                {testResult.message}
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleTestConnection} disabled={testing}>
            {testing ? <Spinner size="sm" animation="border" className="me-2" /> : <FaPlay className="me-2" />}
            Test Connection
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !formData.name}>
            {saving ? <Spinner size="sm" animation="border" /> : (editingConnector ? 'Update' : 'Create')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default ConnectorsPage;
