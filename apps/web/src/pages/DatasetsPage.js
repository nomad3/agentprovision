import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, Alert, Spinner, Card } from 'react-bootstrap';
import Layout from '../components/Layout';
import datasetService from '../services/dataset';

const emptyUploadState = {
  name: '',
  description: '',
  file: null,
};

const DatasetsPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadState, setUploadState] = useState(emptyUploadState);
  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    refreshDatasets();
  }, []);

  const refreshDatasets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await datasetService.getAll();
      setDatasets(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (dataset) => {
    setPreviewDataset(dataset);
    setPreviewLoading(true);
    setSummaryLoading(true);
    setPreviewData(null);
    setSummaryData(null);

    try {
      const [previewResp, summaryResp] = await Promise.all([
        datasetService.getPreview(dataset.id),
        datasetService.getSummary(dataset.id),
      ]);
      setPreviewData(previewResp.data);
      setSummaryData(summaryResp.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dataset preview.');
    } finally {
      setPreviewLoading(false);
      setSummaryLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewDataset(null);
    setPreviewData(null);
    setSummaryData(null);
  };

  const handleUploadClose = () => {
    setShowUpload(false);
    setUploadState(emptyUploadState);
    setError('');
  };

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'file') {
      setUploadState((prev) => ({ ...prev, file: files[0] || null }));
    } else {
      setUploadState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    if (!uploadState.file) {
      setError('Select an Excel file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('name', uploadState.name || uploadState.file.name);
    if (uploadState.description) {
      formData.append('description', uploadState.description);
    }

    setLoading(true);
    setError('');
    try {
      await datasetService.upload(formData);
      handleUploadClose();
      await refreshDatasets();
    } catch (err) {
      console.error(err);
      setError('Dataset upload failed. Ensure the file is a valid Excel document.');
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewTable = useMemo(() => {
    if (!previewData || !previewData.sample_rows || previewData.sample_rows.length === 0) {
      return <p className="text-muted">No sample rows available.</p>;
    }

    const columns = Object.keys(previewData.sample_rows[0]);
    return (
      <Table striped bordered hover responsive size="sm" className="mt-3">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.sample_rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }, [previewData]);

  const renderSummaryCards = useMemo(() => {
    if (!summaryData || !summaryData.numeric_columns || summaryData.numeric_columns.length === 0) {
      return <p className="text-muted">No numeric summary available.</p>;
    }

    return (
      <Row className="g-3 mt-1">
        {summaryData.numeric_columns.map((metric) => (
          <Col md={4} key={metric.column}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>{metric.column}</Card.Title>
                <Card.Text className="mb-1"><strong>Average:</strong> {metric.avg ?? '—'}</Card.Text>
                <Card.Text className="mb-1"><strong>Min:</strong> {metric.min ?? '—'}</Card.Text>
                <Card.Text className="mb-0"><strong>Max:</strong> {metric.max ?? '—'}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }, [summaryData]);

  return (
    <Layout>
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Datasets</h2>
            <p className="text-muted mb-0">Upload Excel files or inspect existing data products before powering Agent Kits.</p>
          </div>
          <Button variant="primary" onClick={() => setShowUpload(true)}>Upload Dataset</Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Rows</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((dataset) => (
              <tr key={dataset.id}>
                <td>{dataset.name}</td>
                <td>{dataset.description}</td>
                <td>{dataset.row_count}</td>
                <td>{dataset.created_at ? new Date(dataset.created_at).toLocaleString() : '—'}</td>
                <td>
                  <Button variant="info" size="sm" onClick={() => openPreview(dataset)}>Preview</Button>
                </td>
              </tr>
            ))}
            {datasets.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">No datasets yet. Upload your first dataset to get started.</td>
              </tr>
            )}
          </tbody>
        </Table>

        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" />
            <span>Processing...</span>
          </div>
        )}

        <Modal show={showUpload} onHide={handleUploadClose} centered>
          <Form onSubmit={handleUploadSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Upload dataset</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Marketing attribution"
                  value={uploadState.name}
                  onChange={handleUploadChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  placeholder="Optional context for collaborators"
                  value={uploadState.description}
                  onChange={handleUploadChange}
                />
              </Form.Group>
              <Form.Group controlId="datasetFile" className="mb-3">
                <Form.Label>Dataset file (.xlsx or .csv)</Form.Label>
                <Form.Control type="file" name="file" accept=".xlsx,.xls,.csv" onChange={handleUploadChange} required />
                <Form.Text className="text-muted">Excel and CSV uploads up to 10MB are supported.</Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleUploadClose}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={Boolean(previewDataset)} onHide={closePreview} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Dataset preview — {previewDataset?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {previewLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>Loading sample rows…</span>
              </div>
            ) : (
              renderPreviewTable
            )}
            <hr />
            <h6 className="text-uppercase text-muted">Numeric summary</h6>
            {summaryLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>Summarizing columns…</span>
              </div>
            ) : (
              renderSummaryCards
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={closePreview}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};

export default DatasetsPage;
