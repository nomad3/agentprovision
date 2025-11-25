import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Tabs, Tab } from 'react-bootstrap';
import { memoryService } from '../services/memory';

function MemoryPage() {
  const [entities, setEntities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  const loadEntities = async () => {
    try {
      const data = await memoryService.getEntities(entityType || null);
      setEntities(data);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntities();
      return;
    }
    try {
      setLoading(true);
      const data = await memoryService.searchEntities(searchQuery);
      setEntities(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const entityTypes = ['customer', 'product', 'concept', 'person'];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Memory & Knowledge</h2>
          <p className="text-muted">Explore agent memories and knowledge graph</p>
        </Col>
      </Row>

      <Tabs defaultActiveKey="knowledge" className="mb-4">
        <Tab eventKey="knowledge" title="Knowledge Graph">
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="outline-primary" onClick={handleSearch}>Search</Button>
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                    <option value="">All Types</option>
                    {entityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">Loading...</div>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Confidence</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.id}>
                        <td>{entity.name}</td>
                        <td><Badge bg="secondary">{entity.entity_type}</Badge></td>
                        <td>{(entity.confidence * 100).toFixed(0)}%</td>
                        <td>{new Date(entity.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button variant="link" size="sm">View Relations</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="memories" title="Agent Memories">
          <Card>
            <Card.Body>
              <p className="text-muted">Select an agent to view their memories</p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default MemoryPage;
