import { useEffect, useState } from 'react';
import { Badge, Button, Col, Container, Form, InputGroup, Row, Tab, Table, Tabs } from 'react-bootstrap';
import PremiumCard from '../components/common/PremiumCard';
import Layout from '../components/Layout';
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
    <Layout>
      <Container fluid className="py-2">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-white mb-1">Memory & Knowledge</h2>
            <p className="text-soft mb-0">Explore agent memories and knowledge graph</p>
          </Col>
        </Row>

        <Tabs defaultActiveKey="knowledge" className="mb-4 custom-tabs">
          <Tab eventKey="knowledge" title="Knowledge Graph">
            <PremiumCard>
              <Row className="mb-4">
                <Col md={6}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-dark text-white border-secondary border-opacity-50"
                    />
                    <Button variant="outline-primary" onClick={handleSearch}>Search</Button>
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="bg-dark text-white border-secondary border-opacity-50"
                  >
                    <option value="">All Types</option>
                    {entityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5 text-soft">Loading...</div>
              ) : (
                <Table hover responsive borderless className="align-middle text-soft">
                  <thead className="text-muted border-bottom border-secondary border-opacity-25">
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
                        <td className="fw-semibold text-white">{entity.name}</td>
                        <td>
                          <Badge bg="secondary" className="bg-opacity-25 text-light border border-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
                            {entity.entity_type}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress" style={{ height: '4px', width: '60px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${entity.confidence * 100}%` }}
                              />
                            </div>
                            <span className="small text-muted">{(entity.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="text-muted small">{new Date(entity.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button variant="link" size="sm" className="text-primary p-0 text-decoration-none">View Relations</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </PremiumCard>
          </Tab>

          <Tab eventKey="memories" title="Agent Memories">
            <PremiumCard>
              <div className="text-center py-5">
                <p className="text-soft mb-0">Select an agent to view their memories</p>
              </div>
            </PremiumCard>
          </Tab>
        </Tabs>
      </Container>
    </Layout>
  );
}

export default MemoryPage;
