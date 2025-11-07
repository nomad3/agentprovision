import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Database, Calculator as CalcIcon, BarChart } from 'react-bootstrap-icons';
import datasetService from '../../services/dataset';
import { LoadingSpinner } from '../common';

const TOOLS = [
  {
    id: 'sql_query',
    name: 'SQL Query Tool',
    icon: Database,
    description: 'Query and analyze datasets with SQL',
    requiresDataset: true,
  },
  {
    id: 'data_summary',
    name: 'Data Summary Tool',
    icon: BarChart,
    description: 'Generate statistical summaries of data',
    requiresDataset: false,
  },
  {
    id: 'calculator',
    name: 'Calculator Tool',
    icon: CalcIcon,
    description: 'Perform mathematical calculations',
    requiresDataset: false,
  },
];

const SkillsDataStep = ({ data, onChange, templateName }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetService.getAll();
      setDatasets(response.data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolToggle = (toolId) => {
    const updatedSkills = { ...data.skills, [toolId]: !data.skills[toolId] };
    onChange({ ...data, skills: updatedSkills });
  };

  const handleDatasetToggle = (datasetId) => {
    const isSelected = data.datasets.includes(datasetId);
    const updatedDatasets = isSelected
      ? data.datasets.filter((id) => id !== datasetId)
      : [...data.datasets, datasetId];
    onChange({ ...data, datasets: updatedDatasets });
  };

  const sqlToolEnabled = data.skills.sql_query;
  const noDatasetSelected = sqlToolEnabled && data.datasets.length === 0;

  return (
    <div className="skills-data-step">
      <h3 className="mb-2">What can your agent do?</h3>
      <p className="text-muted mb-4">Configure your agent's capabilities and data access</p>

      {/* Skills Section */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Skills</h5>
          {templateName && (
            <Alert variant="info" className="mb-3">
              <small>
                <strong>{templateName}</strong> agents typically use these tools
              </small>
            </Alert>
          )}

          {TOOLS.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Card key={tool.id} className="mb-2" style={{ border: '1px solid #dee2e6' }}>
                <Card.Body className="py-3">
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <div className="tool-icon" style={{ fontSize: '1.5rem', color: '#0d6efd' }}>
                        <IconComponent />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{tool.name}</strong>
                          {tool.requiresDataset && (
                            <Badge bg="secondary" className="text-xs">
                              Requires dataset
                            </Badge>
                          )}
                        </div>
                        <small className="text-muted">{tool.description}</small>
                      </div>
                    </div>
                    <Form.Check
                      type="switch"
                      id={`tool-${tool.id}`}
                      label=""
                      checked={data.skills[tool.id]}
                      onChange={() => handleToolToggle(tool.id)}
                      aria-label={tool.name}
                    />
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </Card.Body>
      </Card>

      {/* Datasets Section */}
      <Card>
        <Card.Body>
          <h5 className="mb-2">Connect Datasets (Optional)</h5>
          <p className="text-muted small mb-3">
            Give your agent access to specific data for analysis
          </p>

          {noDatasetSelected && (
            <Alert variant="warning" className="mb-3">
              <small>
                SQL Query Tool is enabled but no datasets are selected. Your agent won't be able to query data.
              </small>
            </Alert>
          )}

          {loading ? (
            <LoadingSpinner text="Loading datasets..." />
          ) : datasets.length === 0 ? (
            <Alert variant="info">
              <small>
                No datasets uploaded yet.{' '}
                <a href="/dashboard/datasets">Upload your first dataset →</a>
              </small>
            </Alert>
          ) : (
            <Row className="g-2">
              {datasets.map((dataset) => (
                <Col key={dataset.id} md={6}>
                  <Card
                    className={`dataset-card ${
                      data.datasets.includes(dataset.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleDatasetToggle(dataset.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body className="p-3">
                      <Form.Check
                        type="checkbox"
                        id={`dataset-${dataset.id}`}
                        label={
                          <div>
                            <div className="fw-bold">{dataset.name}</div>
                            <small className="text-muted">
                              {dataset.row_count || 0} rows
                              {dataset.columns && ` • ${dataset.columns.length} columns`}
                            </small>
                          </div>
                        }
                        checked={data.datasets.includes(dataset.id)}
                        onChange={() => handleDatasetToggle(dataset.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SkillsDataStep;
