import React from 'react';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { FaPen as Pencil } from 'react-icons/fa';

const ReviewStep = ({ wizardData, datasets, onEdit }) => {
  const { template, basicInfo, personality, skills, datasets: datasetIds } = wizardData;

  const selectedDatasets = datasets.filter((d) => datasetIds.includes(d.id));
  const enabledTools = Object.entries(skills)
    .filter(([_, enabled]) => enabled)
    .map(([tool, _]) => tool);

  const toolNames = {
    sql_query: 'SQL Query Tool',
    data_summary: 'Data Summary Tool',
    calculator: 'Calculator Tool',
  };

  const personalityNames = {
    formal: 'Formal & Professional',
    friendly: 'Friendly & Conversational',
    creative: 'Creative & Expressive',
  };

  return (
    <div className="review-step">
      <h3 className="mb-2">Review your agent</h3>
      <p className="text-muted mb-4">Double-check everything looks good before creating</p>

      <Row>
        <Col lg={12}>
          {/* Template */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Template</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => onEdit(1)}>
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.5rem' }}>{basicInfo.avatar || '🤖'}</span>
                <span>{template?.name || 'Custom Agent'}</span>
              </div>
            </Card.Body>
          </Card>

          {/* Basic Info */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Basic Information</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => onEdit(2)}>
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </div>
              <div>
                <strong>Name:</strong> {basicInfo.name}
              </div>
              {basicInfo.description && (
                <div className="mt-1">
                  <strong>Description:</strong> {basicInfo.description}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Personality */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Personality</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => onEdit(3)}>
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </div>
              <div>
                <Badge bg="info">{personalityNames[personality.preset]}</Badge>
                <div className="mt-2 small text-muted">
                  Temperature: {personality.temperature.toFixed(1)} • Max tokens: {personality.max_tokens}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Skills */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Skills</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => onEdit(4)}>
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </div>
              {enabledTools.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {enabledTools.map((tool) => (
                    <Badge key={tool} bg="primary">
                      {toolNames[tool]}
                    </Badge>
                  ))}
                </div>
              ) : (
                <small className="text-muted">No special tools enabled</small>
              )}
            </Card.Body>
          </Card>

          {/* Datasets */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Datasets</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => onEdit(4)}>
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </div>
              {selectedDatasets.length > 0 ? (
                <div>
                  <div className="mb-1">
                    <Badge bg="secondary">{selectedDatasets.length} dataset(s) connected</Badge>
                  </div>
                  <div className="small text-muted">
                    {selectedDatasets.map((d) => d.name).join(', ')}
                  </div>
                </div>
              ) : (
                <small className="text-muted">No datasets connected</small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewStep;
