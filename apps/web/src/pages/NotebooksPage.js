import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { CodeSquare, Database, PlayFill, Table as TableIcon } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import dataSourceService from '../services/dataSource';
import './NotebooksPage.css';

const NotebooksPage = () => {
  const [dataSources, setDataSources] = useState([]);
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 10;');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await dataSourceService.getAll();
      setDataSources(response.data);
      if (response.data.length > 0) {
        setSelectedDataSource(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError('Failed to load data sources.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedDataSource) {
      setError('Please select a data source.');
      return;
    }

    try {
      setExecuting(true);
      setError(null);
      setResults(null);
      const response = await dataSourceService.executeQuery(selectedDataSource, query);
      setResults(response.data);
    } catch (err) {
      console.error('Error executing query:', err);
      setError(err.response?.data?.detail || 'Query execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    if (results.length === 0) return <Alert variant="info">Query returned no results.</Alert>;

    const columns = Object.keys(results[0]);

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={`${idx}-${col}`}>
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="notebooks-page h-100 d-flex flex-column">
        <div className="page-header mb-4">
          <h1 className="page-title">
            <CodeSquare className="title-icon" />
            Data Explorer
          </h1>
          <p className="page-subtitle">Query your data sources directly and analyze results.</p>
        </div>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        <Row className="flex-grow-1">
          <Col md={3} className="h-100">
            <Card className="h-100">
              <Card.Header>
                <Database className="me-2" />
                Data Sources
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner size="sm" animation="border" /></div>
                ) : (
                  <Form.Group>
                    <Form.Label>Select Source</Form.Label>
                    <Form.Select
                      value={selectedDataSource}
                      onChange={(e) => setSelectedDataSource(e.target.value)}
                    >
                      <option value="">Select a source...</option>
                      {dataSources.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                <div className="mt-4 text-muted small">
                  <p><TableIcon className="me-1" /> <strong>Tables</strong></p>
                  <p>Select a source to view tables (Schema browser coming soon).</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9} className="h-100 d-flex flex-column">
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>SQL Query</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecute}
                  disabled={executing || !selectedDataSource}
                >
                  {executing ? <Spinner size="sm" animation="border" /> : <><PlayFill className="me-1" /> Run Query</>}
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <Form.Control
                  as="textarea"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ fontFamily: 'monospace', minHeight: '150px', border: 'none', resize: 'vertical' }}
                  placeholder="SELECT * FROM ..."
                />
              </Card.Body>
            </Card>

            <Card className="flex-grow-1 overflow-hidden">
              <Card.Header>Results</Card.Header>
              <Card.Body className="overflow-auto">
                {renderResults()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default NotebooksPage;
