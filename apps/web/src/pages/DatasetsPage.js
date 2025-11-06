import React, { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import SyncStatusBadge from '../components/SyncStatusBadge';
import datasetService from '../services/dataset';

const emptyUploadState = {
  name: '',
  description: '',
  file: null,
};

const DatasetsPage = () => {
  const { t } = useTranslation('datasets');
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadState, setUploadState] = useState(emptyUploadState);
  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setError(t('error.loading'));
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
      setError(t('error.preview'));
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
      setError(t('error.upload.file'));
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
      setError(t('error.upload.generic'));
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewTable = useMemo(() => {
    if (!previewData || !previewData.sample_rows || previewData.sample_rows.length === 0) {
      return <p className="text-muted">{t('previewModal.empty')}</p>;
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
      return <p className="text-muted">{t('previewModal.summary.empty')}</p>;
    }

    return (
      <Row className="g-3 mt-1">
        {summaryData.numeric_columns.map((metric) => (
          <Col md={4} key={metric.column}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>{metric.column}</Card.Title>
                <Card.Text className="mb-1">
                  <strong>{t('previewModal.summary.metrics.average')}:</strong> {metric.avg ?? '—'}
                </Card.Text>
                <Card.Text className="mb-1">
                  <strong>{t('previewModal.summary.metrics.min')}:</strong> {metric.min ?? '—'}
                </Card.Text>
                <Card.Text className="mb-0">
                  <strong>{t('previewModal.summary.metrics.max')}:</strong> {metric.max ?? '—'}
                </Card.Text>
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
            <h2>{t('pageTitle')}</h2>
            <p className="text-muted mb-0">{t('pageTitleDescription')}</p>
          </div>
          <Button variant="primary" onClick={() => setShowUpload(true)}>{t('uploadModal.launchButton')}</Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>{t('table.columns.name')}</th>
              <th>{t('table.columns.description')}</th>
              <th>{t('table.columns.rows')}</th>
              <th>Databricks Status</th>
              <th>{t('table.columns.created')}</th>
              <th>{t('table.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((dataset) => (
              <tr key={dataset.id}>
                <td>{dataset.name}</td>
                <td>{dataset.description}</td>
                <td>{dataset.row_count}</td>
                <td>
                  <SyncStatusBadge
                    status={dataset.metadata?.sync_status}
                  />
                </td>
                <td>{dataset.created_at ? new Date(dataset.created_at).toLocaleString() : '—'}</td>
                <td>
                  <Button variant="info" size="sm" onClick={() => openPreview(dataset)}>{t('table.actions.preview')}</Button>
                </td>
              </tr>
            ))}
            {datasets.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted">{t('table.empty')}</td>
              </tr>
            )}
          </tbody>
        </Table>

        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" />
            <span>{t('loading')}</span>
          </div>
        )}

        <Modal show={showUpload} onHide={handleUploadClose} centered>
          <Form onSubmit={handleUploadSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{t('uploadModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>{t('uploadModal.form.name.label')}</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder={t('uploadModal.form.name.placeholder')}
                  value={uploadState.name}
                  onChange={handleUploadChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('uploadModal.form.description.label')}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  placeholder={t('uploadModal.form.description.placeholder')}
                  value={uploadState.description}
                  onChange={handleUploadChange}
                />
              </Form.Group>
              <Form.Group controlId="datasetFile" className="mb-3">
                <Form.Label>{t('uploadModal.form.file.label')}</Form.Label>
                <Form.Control type="file" name="file" accept=".xlsx,.xls,.csv" onChange={handleUploadChange} required />
                <Form.Text className="text-muted">{t('uploadModal.form.file.description')}</Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleUploadClose}>{t('uploadModal.actions.cancel')}</Button>
              <Button variant="primary" type="submit" disabled={loading}>{loading ? t('uploadModal.actions.uploading') : t('uploadModal.actions.upload')}</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={Boolean(previewDataset)} onHide={closePreview} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('previewModal.title')} — {previewDataset?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {previewLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>{t('previewModal.loading')}</span>
              </div>
            ) : (
              renderPreviewTable
            )}
            <hr />
            <h6 className="text-uppercase text-muted">{t('previewModal.tabs.summary')}</h6>
            {summaryLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>{t('previewModal.loadingSummary')}</span>
              </div>
            ) : (
              renderSummaryCards
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={closePreview}>{t('previewModal.actions.close')}</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};

export default DatasetsPage;
