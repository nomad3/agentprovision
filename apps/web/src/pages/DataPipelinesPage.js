import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { ArrowRepeat, BellFill, ClockFill, Gear, LightbulbFill, PlayCircleFill, PlayFill, Plus, PlusCircleFill, Trash } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import agentKitService from '../services/agentKit';
import connectorService from '../services/connector';
import dataPipelineService from '../services/dataPipeline';
import dataSourceService from '../services/dataSource';
import './DataPipelinesPage.css';

const DataPipelinesPage = () => {
  const [pipelines, setPipelines] = useState([]);
  const [agentKits, setAgentKits] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'schedule',
    frequency: 'daily',
    agent_kit_id: '',
    data_source_id: '',
    notebook_path: '',
    connector_id: '',
    table_name: '',
    sync_mode: 'full'
  });
  const [submitting, setSubmitting] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const useCases = [
    {
      icon: ClockFill,
      title: 'Scheduled Reports',
      description: 'Automatically generate and send reports daily, weekly, or monthly'
    },
    {
      icon: ArrowRepeat,
      title: 'Data Sync',
      description: 'Keep your data up-to-date by syncing between systems automatically'
    },
    {
      icon: BellFill,
      title: 'Smart Alerts',
      description: 'Get notified when important metrics cross specific thresholds'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pipelinesRes, kitsRes, sourcesRes, connectorsRes] = await Promise.all([
        dataPipelineService.getAll(),
        agentKitService.getAll(),
        dataSourceService.getAll(),
        connectorService.getAll()
      ]);
      console.log('Pipelines Response:', pipelinesRes);
      console.log('Agent Kits Response:', kitsRes);
      setPipelines(pipelinesRes.data);
      setAgentKits(kitsRes.data);
      setDataSources(sourcesRes.data);
      setConnectors(connectorsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const config = {
        type: formData.type,
        frequency: formData.frequency,
        agent_kit_id: formData.agent_kit_id,
        data_source_id: formData.data_source_id,
        notebook_path: formData.notebook_path
      };

      await dataPipelineService.create({
        name: formData.name,
        config: config
      });

      setShowModal(false);
      setFormData({
        name: '',
        type: 'schedule',
        frequency: 'daily',
        agent_kit_id: '',
        data_source_id: '',
        notebook_path: ''
      });
      fetchData();
      setSuccess('Automation created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating pipeline:', err);
      setError('Failed to create automation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this automation?')) {
      try {
        await dataPipelineService.delete(id);
        fetchData();
      } catch (err) {
        console.error('Error deleting pipeline:', err);
        setError('Failed to delete automation');
      }
    }
  };

  const handleExecute = async (id) => {
    try {
      setExecutingId(id);
      await dataPipelineService.execute(id);
      setSuccess('Automation triggered successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error executing pipeline:', err);
      setError('Failed to trigger automation');
    } finally {
      setExecutingId(null);
    }
  };

  const renderEmptyState = () => (
    <Card className="empty-state-card">
      <Card.Body className="text-center">
        <div className="empty-icon-wrapper">
          <ArrowRepeat size={64} className="empty-icon" />
        </div>
        <h3 className="empty-title">No automations yet</h3>
        <p className="empty-description">
          Create your first automation to handle repetitive tasks<br />
          automatically and save hours of manual work.
        </p>

        <Button variant="primary" size="lg" className="create-button" onClick={() => setShowModal(true)}>
          <PlusCircleFill className="me-2" />
          Create Automation
        </Button>

        {/* Use Cases */}
        <div className="use-cases-section">
          <h4 className="use-cases-title">What can you automate?</h4>
          <Row className="g-3">
            {useCases.map((useCase, index) => (
              <Col key={index} md={4}>
                <div className="use-case-card">
                  <useCase.icon size={32} className="use-case-icon" />
                  <h5 className="use-case-title">{useCase.title}</h5>
                  <p className="use-case-description">{useCase.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        <div className="empty-help">
          <LightbulbFill className="help-icon" />
          <div className="help-content">
            <strong>How do automations work?</strong>
            <p>
              Automations run your tasks on a schedule or when specific conditions are met.
              Once set up, they work in the background - you just see the results.
              Perfect for reports, data updates, and monitoring.
            </p>
          </div>
        </div>

        <div className="quick-start">
          <h5 className="quick-start-title">Quick Start Examples:</h5>
          <div className="examples-list">
            <div className="example-item">
              <PlayCircleFill className="example-icon" />
              <span>Send weekly sales report every Monday at 9 AM</span>
            </div>
            <div className="example-item">
              <PlayCircleFill className="example-icon" />
              <span>Update customer data from CRM every night at midnight</span>
            </div>
            <div className="example-item">
              <PlayCircleFill className="example-icon" />
              <span>Alert me when revenue exceeds daily target</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderPipelinesList = () => (
    <div className="pipelines-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Data Pipelines</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-2" />
          New Automation
        </Button>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {pipelines.map((pipeline) => {
          const kit = (agentKits || []).find(k => k.id === pipeline.config?.agent_kit_id);
          return (
            <Col key={pipeline.id}>
              <Card className="h-100 pipeline-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="pipeline-icon-wrapper">
                      <ArrowRepeat size={24} />
                    </div>
                    <div className="pipeline-actions">
                      <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(pipeline.id)}>
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                  <Card.Title>{pipeline.name}</Card.Title>
                  <Card.Text className="text-muted small mb-3">
                    Type: {pipeline.config?.type || 'Custom'}
                    <br />
                    Frequency: {pipeline.config?.frequency || 'Manual'}
                    <br />
                    Agent Kit: {kit ? kit.name : 'None'}
                  </Card.Text>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg="success">Active</Badge>
                    <Badge bg="light" text="dark">Last run: Never</Badge>
                  </div>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="w-100"
                    onClick={() => handleExecute(pipeline.id)}
                    disabled={executingId === pipeline.id}
                  >
                    {executingId === pipeline.id ? (
                      <><Spinner size="sm" animation="border" className="me-2" /> Running...</>
                    ) : (
                      <><PlayFill className="me-2" /> Run Now</>
                    )}
                  </Button>
                </Card.Body>
                <Card.Footer className="bg-transparent border-0">
                  <Button variant="outline-primary" size="sm" className="w-100">
                    <Gear className="me-2" /> Configure
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );

  return (
    <Layout>
      <div className="pipelines-page">
        <div className="page-header">
          <h1 className="page-title">
            <ArrowRepeat className="title-icon" />
            Automations
          </h1>
          <p className="page-subtitle">Set up automated workflows to save time on repetitive tasks</p>
        </div>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          pipelines.length > 0 ? renderPipelinesList() : renderEmptyState()
        )}

        {/* Create Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Automation</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreate}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Automation Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Weekly Sales Report"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="schedule">Scheduled Task</option>
                  <option value="connector_sync">Connector Sync</option>
                  <option value="databricks_job">Databricks Notebook</option>
                  <option value="alert">Alert/Monitor</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Frequency</Form.Label>
                <Form.Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>

              {formData.type === 'connector_sync' ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Data Connector</Form.Label>
                    <Form.Select
                      value={formData.connector_id}
                      onChange={(e) => setFormData({ ...formData, connector_id: e.target.value })}
                      required
                    >
                      <option value="">Select a Connector...</option>
                      {(connectors || []).filter(c => c.status === 'active').map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Only active connectors are shown. Test your connector first.
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Table/Query Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., customers, orders"
                      value={formData.table_name}
                      onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Sync Mode</Form.Label>
                    <Form.Select
                      value={formData.sync_mode}
                      onChange={(e) => setFormData({ ...formData, sync_mode: e.target.value })}
                    >
                      <option value="full">Full Refresh</option>
                      <option value="incremental">Incremental</option>
                    </Form.Select>
                  </Form.Group>
                </>
              ) : formData.type === 'databricks_job' ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Databricks Data Source</Form.Label>
                    <Form.Select
                      value={formData.data_source_id}
                      onChange={(e) => setFormData({ ...formData, data_source_id: e.target.value })}
                      required
                    >
                      <option value="">Select a Data Source...</option>
                      {dataSources.filter(ds => ds.type === 'databricks').map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Notebook Path</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="/Users/me/my-notebook"
                      value={formData.notebook_path}
                      onChange={(e) => setFormData({ ...formData, notebook_path: e.target.value })}
                      required
                    />
                  </Form.Group>
                </>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Agent Kit (Optional)</Form.Label>
                  <Form.Select
                    value={formData.agent_kit_id}
                    onChange={(e) => setFormData({ ...formData, agent_kit_id: e.target.value })}
                  >
                    <option value="">Select an Agent Kit...</option>
                    {(agentKits || []).map(kit => (
                      <option key={kit.id} value={kit.id}>{kit.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select an Agent Kit to execute for this automation.
                  </Form.Text>
                </Form.Group>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" animation="border" /> : 'Create Automation'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default DataPipelinesPage;
