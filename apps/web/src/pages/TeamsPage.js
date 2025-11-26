import { useEffect, useState } from 'react';
import { Badge, Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import PremiumCard from '../components/common/PremiumCard';
import Layout from '../components/Layout';
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
    <Layout>
      <Container fluid className="py-2">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold text-white mb-1">Agent Teams</h2>
            <p className="text-soft mb-0">Manage agent groups and orchestration</p>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => setShowModal(true)} className="px-4">
              Create Team
            </Button>
          </Col>
        </Row>

        <Row className="g-4">
          {loading ? (
            <Col className="text-center py-5 text-soft">Loading...</Col>
          ) : groups.length === 0 ? (
            <Col className="text-center py-5">
              <PremiumCard className="p-5 text-center">
                <h4 className="text-white mb-3">No teams yet</h4>
                <p className="text-soft mb-4">Create your first agent team to start orchestrating tasks.</p>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  Create Team
                </Button>
              </PremiumCard>
            </Col>
          ) : (
            groups.map((group) => (
              <Col md={4} key={group.id}>
                <PremiumCard className="h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h4 className="text-white mb-0">{group.name}</h4>
                    <Badge bg="primary" className="bg-opacity-25 text-primary border border-primary">Active</Badge>
                  </div>
                  <p className="text-soft mb-4" style={{ minHeight: '3rem' }}>{group.description || 'No description provided.'}</p>

                  <div className="mb-4">
                    <div className="text-uppercase text-muted small fw-bold mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Team Goal</div>
                    <div className="d-flex align-items-center">
                      <Badge bg="info" className="bg-opacity-10 text-info border border-info fw-normal p-2">
                        {group.goal || 'Not set'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
                    <Button variant="outline-light" size="sm" className="w-100 text-soft border-secondary border-opacity-50">View Team Details</Button>
                  </div>
                </PremiumCard>
              </Col>
            ))
          )}
        </Row>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="bg-dark border border-secondary border-opacity-50 text-white">
          <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25">
            <Modal.Title>Create Agent Team</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreate}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="text-soft">Team Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-50"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-soft">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-50"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-soft">Team Goal</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-50"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-secondary border-opacity-25">
              <Button variant="outline-light" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create Team</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </Layout>
  );
}

export default TeamsPage;
