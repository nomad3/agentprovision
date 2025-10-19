import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import dataSourceService from '../services/dataSource';

const DataSourcesPage = () => {
  const [dataSources, setDataSources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '', config: '{}' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const response = await dataSourceService.getAll();
      setDataSources(response.data);
    } catch (err) {
      setError('Failed to fetch data sources.');
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDataSource(null);
    setFormData({ name: '', type: '', config: '{}' });
    setError('');
  };

  const handleShowModal = (dataSource = null) => {
    if (dataSource) {
      setEditingDataSource(dataSource);
      setFormData({ name: dataSource.name, type: dataSource.type, config: JSON.stringify(dataSource.config, null, 2) });
    } else {
      setEditingDataSource(null);
      setFormData({ name: '', type: '', config: '{}' });
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

      if (editingDataSource) {
        await dataSourceService.update(editingDataSource.id, data);
      } else {
        await dataSourceService.create(data);
      }
      fetchDataSources();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save data source. Please check your config JSON.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      try {
        await dataSourceService.remove(id);
        fetchDataSources();
      } catch (err) {
        setError('Failed to delete data source.');
        console.error(err);
      }
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Data Sources</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>Add Data Source</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dataSources.map((ds) => (
            <tr key={ds.id}>
              <td>{ds.name}</td>
              <td>{ds.type}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => handleShowModal(ds)}>Edit</Button>{' '}
                <Button variant="danger" size="sm" onClick={() => handleDelete(ds.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDataSource ? 'Edit' : 'Add'} Data Source</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control type="text" name="type" value={formData.type} onChange={handleChange} required />
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

export default DataSourcesPage;