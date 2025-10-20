import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import agentKitService from '../services/agentKit';

const AgentKitsPage = () => {
  const [agentKits, setAgentKits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAgentKit, setEditingAgentKit] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', version: '', config: '{}' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgentKits();
  }, []);

  const fetchAgentKits = async () => {
    try {
      const response = await agentKitService.getAll();
      setAgentKits(response.data);
    } catch (err) {
      setError('Failed to fetch agent kits.');
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgentKit(null);
    setFormData({ name: '', description: '', version: '', config: '{}' });
    setError('');
  };

  const handleShowModal = (agentKit = null) => {
    if (agentKit) {
      setEditingAgentKit(agentKit);
      setFormData({ name: agentKit.name, description: agentKit.description, version: agentKit.version, config: JSON.stringify(agentKit.config, null, 2) });
    } else {
      setEditingAgentKit(null);
      setFormData({ name: '', description: '', version: '', config: '{}' });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = JSON.parse(formData.config);
      const data = { ...formData, config };

      if (editingAgentKit) {
        await agentKitService.update(editingAgentKit.id, data);
      } else {
        await agentKitService.create(data);
      }
      fetchAgentKits();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save agent kit. Please check your config JSON.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this agent kit?')) {
      try {
        await agentKitService.remove(id);
        fetchAgentKits();
      } catch (err) {
        setError('Failed to delete agent kit.');
        console.error(err);
      }
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Agent Kits</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>Add Agent Kit</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agentKits.map((ak) => (
            <tr key={ak.id}>
              <td>{ak.name}</td>
              <td>{ak.description}</td>
              <td>{ak.version}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => handleShowModal(ak)}>Edit</Button>{' '}
                <Button variant="danger" size="sm" onClick={() => handleDelete(ak.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingAgentKit ? 'Edit' : 'Add'} Agent Kit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control type="text" name="description" value={formData.description} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Control type="text" name="version" value={formData.version} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Config (JSON)</Form.Label>
              <Form.Control as="textarea" rows={5} name="config" value={formData.config} onChange={handleChange} required />
            </Form.Group>
            <Button variant="primary" type="submit">Save</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default AgentKitsPage;