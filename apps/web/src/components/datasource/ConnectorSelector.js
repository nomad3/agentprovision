import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import {
  DatabaseFill,
  FileEarmarkSpreadsheetFill,
  CloudFill,
  PlugFill,
  FileEarmarkArrowUpFill
} from 'react-bootstrap-icons';

const CONNECTORS = [
  {
    id: 'postgresql',
    name: 'PostgreSQL / MySQL',
    icon: DatabaseFill,
    description: 'Connect to your relational database',
    category: 'database',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: FileEarmarkSpreadsheetFill,
    description: 'Sync spreadsheets automatically',
    category: 'cloud',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: CloudFill,
    description: 'Import CRM data',
    category: 'cloud',
  },
  {
    id: 'rest_api',
    name: 'REST API',
    icon: PlugFill,
    description: 'Connect to any API endpoint',
    category: 'api',
  },
  {
    id: 'file_upload',
    name: 'File Upload',
    icon: FileEarmarkArrowUpFill,
    description: 'One-time CSV or Excel import',
    category: 'file',
  },
];

const ConnectorSelector = ({ onSelect, selectedConnector }) => {
  return (
    <div className="connector-selector">
      <h4 className="mb-2">Choose Data Source Type</h4>
      <p className="text-muted mb-4">Select how you want to connect your data</p>

      <Row className="g-3">
        {CONNECTORS.map((connector) => {
          const IconComponent = connector.icon;
          const isSelected = selectedConnector === connector.id;

          return (
            <Col key={connector.id} md={6} lg={4}>
              <Card
                className={`connector-card h-100 ${isSelected ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(connector)}
              >
                <Card.Body className="d-flex flex-column align-items-center text-center">
                  <div className="connector-icon mb-3">
                    <IconComponent size={48} />
                  </div>
                  <Card.Title className="mb-2 h6">{connector.name}</Card.Title>
                  <Card.Text className="text-muted small mb-3 flex-grow-1">
                    {connector.description}
                  </Card.Text>
                  <Button
                    variant={isSelected ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(connector);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export { CONNECTORS };
export default ConnectorSelector;
