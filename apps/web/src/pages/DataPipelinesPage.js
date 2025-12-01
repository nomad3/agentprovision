import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { ArrowRepeat, BellFill, ClockFill, Gear, LightbulbFill, PlayCircleFill, PlusCircleFill, Trash } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import dataPipelineService from '../services/dataPipeline';
import './DataPipelinesPage.css';

const DataPipelinesPage = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'schedule', frequency: 'daily', target: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const response = await dataPipelineService.getAll();
      setPipelines(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pipelines:', err);
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
        target: formData.target
      };

      await dataPipelineService.create({
        name: formData.name,
        config: config
      });

      setShowModal(false);
      setFormData({ name: '', type: 'schedule', frequency: 'daily', target: '' });
      fetchPipelines();
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
        fetchPipelines();
      } catch (err) {
        console.error('Error deleting pipeline:', err);
        setError('Failed to delete automation');
      }
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
        <h4 className="mb-0">Active Automations</h4>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <PlusCircleFill className="me-2" />
          New Automation
        </Button>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {pipelines.map((pipeline) => (
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
                </Card.Text>
                <div className="d-flex gap-2">
                  <Badge bg="success">Active</Badge>
                  <Badge bg="light" text="dark">Last run: Never</Badge>
                </div>
              </Card.Body>
              <Card.Footer className="bg-transparent border-0">
                <Button variant="outline-primary" size="sm" className="w-100">
                  <Gear className="me-2" /> Configure
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
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
                  <option value="sync">Data Sync</option>
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

              <Form.Group className="mb-3">
                <Form.Label>Target (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Dataset ID or Email"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
              </Form.Group>
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
