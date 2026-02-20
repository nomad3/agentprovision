import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Container, Form, InputGroup, Modal, Row, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { FaCloudUploadAlt, FaFileAlt } from 'react-icons/fa';
import PremiumCard from '../components/common/PremiumCard';
import Layout from '../components/Layout';
import api from '../services/api';
import { memoryService } from '../services/memory';

function MemoryPage() {
  const [entities, setEntities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entityType, setEntityType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [relations, setRelations] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [showRelations, setShowRelations] = useState(false);

  useEffect(() => {
    loadEntities();
  }, [categoryFilter, entityType, statusFilter]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (entityType) params.append('entity_type', entityType);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');
      const res = await api.get(`/knowledge/entities?${params.toString()}`);
      setEntities(res.data || []);
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

  const handleImport = async (event, provider) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = provider === 'chatgpt'
        ? '/integrations/import/chatgpt'
        : '/integrations/import/claude';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Failed to import chat history'
      });
    } finally {
      setImporting(false);
      event.target.value = null;
    }
  };

  const handleViewRelations = async (entity) => {
    setSelectedEntity(entity);
    setShowRelations(true);
    setRelationsLoading(true);
    try {
      const res = await api.get(`/knowledge/entities/${entity.id}/relations`);
      setRelations(res.data || []);
    } catch (error) {
      console.error('Failed to load relations:', error);
      setRelations([]);
    } finally {
      setRelationsLoading(false);
    }
  };

  const getRelatedEntityName = (relation) => {
    if (relation.from_entity_id === selectedEntity?.id) {
      const target = entities.find(e => e.id === relation.to_entity_id);
      return target ? target.name : relation.to_entity_id;
    }
    const source = entities.find(e => e.id === relation.from_entity_id);
    return source ? source.name : relation.from_entity_id;
  };

  const getRelationDirection = (relation) => {
    return relation.from_entity_id === selectedEntity?.id ? 'outgoing' : 'incoming';
  };

  const categories = ['lead', 'contact', 'investor', 'accelerator', 'organization', 'person'];

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'lead': return 'success';
      case 'contact': return 'info';
      case 'investor': return 'primary';
      case 'accelerator': return 'info';
      default: return 'secondary';
    }
  };

  const uniqueTypes = [...new Set(entities.map(e => e.entity_type))].sort();

  return (
    <Layout>
      <Container fluid className="py-2">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold mb-1">Memory</h2>
            <p className="text-soft mb-0">Entities, signals, and relations</p>
          </Col>
        </Row>

        <Tabs defaultActiveKey="entities" className="mb-4 custom-tabs">
          <Tab eventKey="entities" title="Entities">
            <PremiumCard>
              <Row className="mb-4">
                <Col md={4}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="border-secondary border-opacity-50"
                    />
                    <Button variant="outline-primary" onClick={handleSearch}>Search</Button>
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border-secondary border-opacity-50"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="border-secondary border-opacity-50"
                  >
                    <option value="">All Types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-secondary border-opacity-50"
                  >
                    <option value="">All Statuses</option>
                    {['draft', 'verified', 'enriched', 'actioned', 'archived'].map(s => (
                      <option key={s} value={s}>{s}</option>
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
                      <th>Category</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Confidence</th>
                      <th>Source</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.id}>
                        <td className="fw-semibold">{entity.name}</td>
                        <td>
                          <Badge
                            bg={getCategoryBadgeColor(entity.category)}
                            className="bg-opacity-25 border border-secondary text-uppercase"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {entity.category || 'uncategorized'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="secondary" className="bg-opacity-25 border border-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
                            {entity.entity_type}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={entity.status === 'verified' ? 'success' : entity.status === 'enriched' ? 'info' : entity.status === 'actioned' ? 'primary' : 'warning'}
                            className="bg-opacity-25 border border-secondary text-uppercase"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {entity.status || 'draft'}
                          </Badge>
                        </td>
                        <td>
                          {entity.score != null ? (
                            <Badge
                              bg={entity.score >= 61 ? 'success' : entity.score >= 31 ? 'warning' : 'danger'}
                              className="bg-opacity-25 border border-secondary"
                              style={{ fontSize: '0.75rem', minWidth: '36px' }}
                            >
                              {entity.score}
                            </Badge>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress" style={{ height: '4px', width: '60px', backgroundColor: 'rgba(100,130,170,0.15)' }}>
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${entity.confidence * 100}%` }}
                              />
                            </div>
                            <span className="small text-muted">{(entity.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="text-muted small">
                          {entity.source_url ? (
                            <a href={entity.source_url} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                              Source
                            </a>
                          ) : '-'}
                        </td>
                        <td className="text-muted small">{entity.created_at ? new Date(entity.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <Button variant="link" size="sm" className="text-primary p-0 text-decoration-none" onClick={() => handleViewRelations(entity)}>View Relations</Button>
                        </td>
                      </tr>
                    ))}
                    {entities.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-4">No entities found. Use the AI agent to research and store leads, contacts, and signals.</td>
                      </tr>
                    )}
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

          <Tab eventKey="import" title="Import">
            <PremiumCard>
              <div className="mb-4">
                <h4>Import Chat History</h4>
                <p className="text-soft">Upload chat exports from other LLM providers to build your knowledge base.</p>
              </div>

              {importMessage && (
                <Alert variant={importMessage.type} dismissible onClose={() => setImportMessage(null)}>
                  {importMessage.text}
                </Alert>
              )}

              <Row className="g-4">
                <Col md={6}>
                  <div className="p-4 border border-secondary border-opacity-25 rounded bg-light bg-opacity-25 text-center h-100">
                    <div className="mb-3">
                      <FaFileAlt size={48} className="text-success" />
                    </div>
                    <h5>ChatGPT Export</h5>
                    <p className="text-soft small mb-4">Upload your <code>conversations.json</code> file from OpenAI export.</p>

                    <div className="d-grid">
                      <input
                        type="file"
                        id="chatgpt-upload"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImport(e, 'chatgpt')}
                        disabled={importing}
                      />
                      <Button
                        variant="outline-success"
                        onClick={() => document.getElementById('chatgpt-upload').click()}
                        disabled={importing}
                      >
                        {importing ? <Spinner animation="border" size="sm" /> : <><FaCloudUploadAlt className="me-2" /> Upload ChatGPT JSON</>}
                      </Button>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-4 border border-secondary border-opacity-25 rounded bg-light bg-opacity-25 text-center h-100">
                    <div className="mb-3">
                      <FaFileAlt size={48} className="text-warning" />
                    </div>
                    <h5>Claude Export</h5>
                    <p className="text-soft small mb-4">Upload your <code>conversations.json</code> file from Anthropic export.</p>

                    <div className="d-grid">
                      <input
                        type="file"
                        id="claude-upload"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImport(e, 'claude')}
                        disabled={importing}
                      />
                      <Button
                        variant="outline-warning"
                        onClick={() => document.getElementById('claude-upload').click()}
                        disabled={importing}
                      >
                        {importing ? <Spinner animation="border" size="sm" /> : <><FaCloudUploadAlt className="me-2" /> Upload Claude JSON</>}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </PremiumCard>
          </Tab>
        </Tabs>

        <Modal show={showRelations} onHide={() => setShowRelations(false)} size="lg" centered contentClassName="bg-dark text-light border-secondary">
          <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25">
            <Modal.Title className="fs-5">
              Relations for <span className="text-primary">{selectedEntity?.name}</span>
              {selectedEntity?.category && (
                <Badge bg={getCategoryBadgeColor(selectedEntity.category)} className="ms-2 bg-opacity-25 border border-secondary text-uppercase" style={{ fontSize: '0.65rem' }}>
                  {selectedEntity.category}
                </Badge>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {relationsLoading ? (
              <div className="text-center py-4"><Spinner animation="border" size="sm" className="text-primary" /></div>
            ) : relations.length === 0 ? (
              <p className="text-soft text-center py-4 mb-0">No relations found for this entity.</p>
            ) : (
              <Table hover responsive borderless className="align-middle text-soft mb-0">
                <thead className="text-muted border-bottom border-secondary border-opacity-25">
                  <tr>
                    <th>Direction</th>
                    <th>Relation</th>
                    <th>Connected Entity</th>
                    <th>Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {relations.map((rel) => (
                    <tr key={rel.id}>
                      <td>
                        <Badge bg={getRelationDirection(rel) === 'outgoing' ? 'info' : 'secondary'} className="bg-opacity-25 border border-secondary" style={{ fontSize: '0.7rem' }}>
                          {getRelationDirection(rel) === 'outgoing' ? '\u2192 outgoing' : '\u2190 incoming'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="primary" className="bg-opacity-25 border border-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
                          {rel.relation_type}
                        </Badge>
                      </td>
                      <td className="fw-semibold">{getRelatedEntityName(rel)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress" style={{ height: '4px', width: '40px', backgroundColor: 'rgba(100,130,170,0.15)' }}>
                            <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(rel.strength || 1) * 100}%` }} />
                          </div>
                          <span className="small text-muted">{((rel.strength || 1) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </Layout>
  );
}

export default MemoryPage;
