import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaDatabase as Database, FaCalculator as CalcIcon, FaChartBar as BarChart, FaProjectDiagram, FaSearch, FaChartLine } from 'react-icons/fa';
import datasetService from '../../services/dataset';
import { LoadingSpinner } from '../common';

const TOOLS = [
  {
    id: 'sql_query',
    name: 'Data Analysis',
    icon: Database,
    description: 'Let your agent answer questions about your data',
    requiresDataset: true,
    helpText: 'Enable this if you want your agent to query and analyze datasets',
  },
  {
    id: 'data_summary',
    name: 'Quick Statistics',
    icon: BarChart,
    description: 'Generate summaries and statistics automatically',
    requiresDataset: false,
    helpText: 'Your agent can provide statistical overviews of data',
  },
  {
    id: 'calculator',
    name: 'Math & Calculations',
    icon: CalcIcon,
    description: 'Perform calculations and number crunching',
    requiresDataset: false,
    helpText: 'Enable this for pricing, conversions, or any math needs',
  },
  {
    id: 'entity_extraction',
    name: 'Entity Extraction',
    icon: FaProjectDiagram,
    description: 'Extract people, companies, and concepts from text',
    requiresDataset: false,
    helpText: 'Your agent can identify and store entities from conversations and documents into the knowledge graph',
  },
  {
    id: 'knowledge_search',
    name: 'Knowledge Search',
    icon: FaSearch,
    description: 'Search and browse the knowledge graph',
    requiresDataset: false,
    helpText: 'Your agent can look up people, companies, and concepts previously extracted into the knowledge graph',
  },
  {
    id: 'lead_scoring',
    name: 'Lead Scoring',
    icon: FaChartLine,
    description: 'Score leads 0-100 based on hiring signals, tech stack, funding, and fit',
    requiresDataset: false,
    helpText: 'Your agent can compute composite lead scores using AI analysis of entity data',
  },
];

const ToolCard = ({ tool, isChecked, onToggle }) => {
  const [showHelp, setShowHelp] = useState(false);
  const IconComponent = tool.icon;

  return (
    <Card key={tool.id} className="mb-2">
      <Card.Body className="py-3">
        <div className="d-flex align-items-start justify-content-between">
          <div className="d-flex align-items-start gap-3 flex-grow-1">
            <div className="tool-icon" style={{ fontSize: '1.5rem', color: '#0d6efd' }}>
              <IconComponent />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <strong>{tool.name}</strong>
                <button
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setShowHelp(!showHelp)}
                  style={{ textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  {showHelp ? 'Hide' : 'Learn more'}
                </button>
              </div>
              <small className="text-muted">{tool.description}</small>
              {showHelp && (
                <div className="alert alert-info mt-2 mb-0 p-2">
                  <small>{tool.helpText}</small>
                </div>
              )}
            </div>
          </div>
          <Form.Check
            type="switch"
            id={`tool-${tool.id}`}
            label=""
            checked={isChecked}
            onChange={onToggle}
            aria-label={tool.name}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

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
            <Alert variant="success" className="mb-3">
              <small>
                ✓ Based on your <strong>{templateName}</strong> template, we've pre-selected the recommended tools below. You can enable or disable any of them.
              </small>
            </Alert>
          )}

          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isChecked={data.skills[tool.id]}
              onToggle={() => handleToolToggle(tool.id)}
            />
          ))}
        </Card.Body>
      </Card>

      {/* Datasets Section */}
      <Card>
        <Card.Body>
          <h5 className="mb-2">Give Your Agent Access to Data</h5>
          <p className="text-muted small mb-3">
            Select which datasets your agent can analyze (you can change this later)
          </p>

          {noDatasetSelected && (
            <Alert variant="warning" className="mb-3">
              <small>
                Data Analysis is enabled but no datasets are selected. Your agent won't be able to analyze data.
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
