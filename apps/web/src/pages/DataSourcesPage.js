import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import {
  CheckCircleFill,
  Cloud,
  Database,
  HddNetwork,
  PencilSquare,
  PlusCircleFill,
  Server,
  Trash
} from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import dataSourceService from '../services/dataSource';
import './DataSourcesPage.css'; // We'll create this next

const DataSourcesPage = () => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'databricks', config: {} });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await dataSourceService.getAll();
      setDataSources(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError('Failed to load data sources.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (dataSource = null) => {
    if (dataSource) {
      setEditingId(dataSource.id);
      setFormData({
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config || {}
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: 'databricks', config: {} });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', type: 'databricks', config: {} });
    setError(null);
  };

  const handleConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await dataSourceService.update(editingId, formData);
        setSuccess('Data source updated successfully');
      } else {
        await dataSourceService.create(formData);
        setSuccess('Data source created successfully');
      }
      fetchDataSources();
      handleCloseModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving data source:', err);
      setError('Failed to save data source.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      try {
        await dataSourceService.remove(id);
        setSuccess('Data source deleted successfully');
        fetchDataSources();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error deleting data source:', err);
        setError('Failed to delete data source.');
      }
    }
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'databricks':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Databricks Host</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://adb-xxxx.xx.azuredatabricks.net"
                value={formData.config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Access Token</Form.Label>
              <Form.Control
                type="password"
                placeholder="dapi..."
                value={formData.config.token || ''}
                onChange={(e) => handleConfigChange('token', e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>HTTP Path / Warehouse ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="/sql/1.0/warehouses/..."
                value={formData.config.http_path || ''}
                onChange={(e) => handleConfigChange('http_path', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cluster ID (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="0123-456789-abcdef12"
                value={formData.config.cluster_id || ''}
                onChange={(e) => handleConfigChange('cluster_id', e.target.value)}
              />
              <Form.Text className="text-muted">Required for running Notebook jobs.</Form.Text>
            </Form.Group>
          </>
        );
      case 'postgres':
        return (
          <>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Host</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="localhost"
                    value={formData.config.host || ''}
                    onChange={(e) => handleConfigChange('host', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Port</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="5432"
                    value={formData.config.port || ''}
                    onChange={(e) => handleConfigChange('port', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Database Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.config.database || ''}
                onChange={(e) => handleConfigChange('database', e.target.value)}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.config.username || ''}
                    onChange={(e) => handleConfigChange('username', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.config.password || ''}
                    onChange={(e) => handleConfigChange('password', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );
      default:
        return (
          <Form.Group className="mb-3">
            <Form.Label>Configuration (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={JSON.stringify(formData.config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, config: parsed }));
                } catch (err) {
                  // Allow typing invalid JSON temporarily
                }
              }}
            />
          </Form.Group>
        );
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'databricks': return <Cloud size={24} className="text-info" />;
      case 'postgres': return <Database size={24} className="text-primary" />;
      default: return <Server size={24} className="text-secondary" />;
    }
  };

  return (
    <Layout>
      <div className="datasources-page">
        <div className="page-header">
          <h1 className="page-title">
            <HddNetwork className="title-icon" />
            Data Sources
          </h1>
          <p className="page-subtitle">Connect and manage your external data sources</p>
        </div>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

        <div className="d-flex justify-content-end mb-4">
          <Button variant="primary" onClick={() => handleShowModal()}>
            <PlusCircleFill className="me-2" />
            Add Data Source
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {dataSources.map((ds) => (
              <Col key={ds.id}>
                <Card className="h-100 datasource-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="datasource-icon-wrapper">
                        {getTypeIcon(ds.type)}
                      </div>
                      <div className="datasource-actions">
                        <Button variant="link" className="text-primary p-0 me-2" onClick={() => handleShowModal(ds)}>
                          <PencilSquare size={16} />
                        </Button>
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(ds.id)}>
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                    <Card.Title>{ds.name}</Card.Title>
                    <div className="mb-2">
                      <Badge bg="light" text="dark" className="border">
                        {ds.type}
                      </Badge>
                    </div>
                    <Card.Text className="text-muted small">
                      {ds.type === 'databricks' && ds.config?.host ? (
                        <span className="text-truncate d-block" title={ds.config.host}>
                          Host: {ds.config.host}
                        </span>
                      ) : (
                        <span className="text-muted">Configured</span>
                      )}
                    </Card.Text>
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex align-items-center text-success small">
                        <CheckCircleFill className="me-1" />
                        Connected
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {dataSources.length === 0 && (
              <Col xs={12}>
                <div className="text-center py-5 text-muted">
                  <Database size={48} className="mb-3 opacity-50" />
                  <h5>No data sources yet</h5>
                  <p>Connect your first data source to get started.</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingId ? 'Edit' : 'Add'} Data Source</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Production DB"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value, config: {} })}
                    >
                      <option value="databricks">Databricks</option>
                      <option value="postgres">PostgreSQL</option>
                      <option value="s3">Amazon S3</option>
                      <option value="api">REST API</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="config-section p-3 bg-light rounded mb-3">
                <h6 className="mb-3 text-muted">Connection Details</h6>
                {renderConfigFields()}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" animation="border" /> : (editingId ? 'Update' : 'Connect')}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default DataSourcesPage;
