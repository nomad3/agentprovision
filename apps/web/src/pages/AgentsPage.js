import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  InputGroup,
  Dropdown,
} from 'react-bootstrap';
import {
  Robot,
  Plus,
  Search,
  Pencil,
  Trash,
  Play,
  Pause,
  ThreeDotsVertical,
} from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import { EmptyState, LoadingSpinner, ConfirmModal } from '../components/common';
import agentService from '../services/agent';
import './AgentsPage.css';

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model: 'gpt-4',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 2000,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAll();
      setAgents(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await agentService.create(formData);
      setShowCreateModal(false);
      resetForm();
      fetchAgents();
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('Failed to create agent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await agentService.update(selectedAgent.id, formData);
      setShowEditModal(false);
      resetForm();
      fetchAgents();
    } catch (err) {
      console.error('Error updating agent:', err);
      setError('Failed to update agent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgent = async () => {
    try {
      setSubmitting(true);
      await agentService.delete(selectedAgent.id);
      setShowDeleteModal(false);
      setSelectedAgent(null);
      fetchAgents();
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete agent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      model: agent.model || 'gpt-4',
      system_prompt: agent.system_prompt || '',
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || 2000,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (agent) => {
    setSelectedAgent(agent);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      model: 'gpt-4',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 2000,
    });
    setSelectedAgent(null);
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      error: 'danger',
      deploying: 'warning',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status || 'inactive'}</Badge>;
  };

  return (
    <Layout>
      <div className="page-header mb-4">
        <div>
          <h2 className="page-title">
            <Robot className="me-2" size={32} />
            AI Agents
          </h2>
          <p className="page-subtitle">
            Create, configure, and manage your AI agents
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <Plus size={20} />
          Create Agent
        </Button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      <Card className="data-card mb-4">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text className="search-icon-wrapper">
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search agents by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {loading ? (
        <LoadingSpinner text="Loading agents..." />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={Robot}
          title={searchTerm ? 'No agents found' : 'No agents yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first AI agent'
          }
          action={
            !searchTerm && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="me-2" />
                Create Your First Agent
              </Button>
            )
          }
        />
      ) : (
        <Card className="data-card">
          <Table hover responsive className="agents-table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Model</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="agent-icon">
                        <Robot size={20} />
                      </div>
                      <strong>{agent.name}</strong>
                    </div>
                  </td>
                  <td className="text-muted">{agent.description || '—'}</td>
                  <td>
                    <Badge bg="info">{agent.model || 'gpt-4'}</Badge>
                  </td>
                  <td>{getStatusBadge(agent.status)}</td>
                  <td className="text-muted">
                    {agent.created_at
                      ? new Date(agent.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(agent)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(agent)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        show={showCreateModal || showEditModal}
        onHide={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        size="lg"
        centered
        className="agent-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showCreateModal ? 'Create New Agent' : 'Edit Agent'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={showCreateModal ? handleCreateAgent : handleUpdateAgent}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Customer Support Agent"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model *</Form.Label>
                  <Form.Select
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Describe what this agent does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>System Prompt</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter the system prompt that defines the agent's behavior..."
                value={formData.system_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, system_prompt: e.target.value })
                }
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Temperature: {formData.temperature}</Form.Label>
                  <Form.Range
                    min={0}
                    max={1}
                    step={0.1}
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                  />
                  <Form.Text className="text-muted">
                    Controls randomness. Higher = more creative.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Tokens</Form.Label>
                  <Form.Control
                    type="number"
                    min={100}
                    max={8000}
                    value={formData.max_tokens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_tokens: parseInt(e.target.value),
                      })
                    }
                  />
                  <Form.Text className="text-muted">
                    Maximum length of the response
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : showCreateModal
                ? 'Create Agent'
                : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedAgent(null);
        }}
        onConfirm={handleDeleteAgent}
        title="Delete Agent"
        message={`Are you sure you want to delete "${selectedAgent?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        confirmLoading={submitting}
      />
    </Layout>
  );
};

export default AgentsPage;
