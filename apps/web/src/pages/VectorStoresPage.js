import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import vectorStoreService from '../services/vectorStore';

const VectorStoresPage = () => {
  const [vectorStores, setVectorStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVectorStore, setEditingVectorStore] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', config: '{}' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVectorStores();
  }, []);

  const fetchVectorStores = async () => {
    try {
      const response = await vectorStoreService.getAll();
      setVectorStores(response.data);
    } catch (err) {
      setError('Failed to fetch vector stores.');
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVectorStore(null);
    setFormData({ name: '', description: '', config: '{}' });
    setError('');
  };

  const handleShowModal = (vectorStore = null) => {
    if (vectorStore) {
      setEditingVectorStore(vectorStore);
      setFormData({ name: vectorStore.name, description: vectorStore.description, config: JSON.stringify(vectorStore.config, null, 2) });
    } else {
      setEditingVectorStore(null);
      setFormData({ name: '', description: '', config: '{}' });
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

      if (editingVectorStore) {
        await vectorStoreService.update(editingVectorStore.id, data);
      } else {
        await vectorStoreService.create(data);
      }
      fetchVectorStores();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save vector store. Please check your config JSON.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vector store?')) {
      try {
        await vectorStoreService.remove(id);
        fetchVectorStores();
      } catch (err) {
        setError('Failed to delete vector store.');
        console.error(err);
      }
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Vector Stores</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>Add Vector Store</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vectorStores.map((vs) => (
            <tr key={vs.id}>
              <td>{vs.name}</td>
              <td>{vs.description}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => handleShowModal(vs)}>Edit</Button>{' '}
                <Button variant="danger" size="sm" onClick={() => handleDelete(vs.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingVectorStore ? 'Edit' : 'Add'} Vector Store</Modal.Title>
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

export default VectorStoresPage;