import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { teamsService } from '../services/teams';

function TeamsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', goal: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await teamsService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await teamsService.createGroup(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', goal: '' });
      loadGroups();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Agent Teams</h2>
          <p className="text-muted">Manage agent groups and orchestration</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create Team
          </Button>
        </Col>
      </Row>

      <Row>
        {loading ? (
          <Col className="text-center py-5">Loading...</Col>
        ) : groups.length === 0 ? (
          <Col className="text-center py-5">
            <p>No teams yet. Create your first agent team!</p>
          </Col>
        ) : (
          groups.map((group) => (
            <Col md={4} key={group.id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{group.name}</Card.Title>
                  <Card.Text className="text-muted">{group.description}</Card.Text>
                  <div className="mb-2">
                    <Badge bg="info" className="me-2">Goal: {group.goal || 'Not set'}</Badge>
                  </div>
                  <Button variant="outline-primary" size="sm">View Team</Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Agent Team</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Team Goal</Form.Label>
              <Form.Control
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default TeamsPage;
