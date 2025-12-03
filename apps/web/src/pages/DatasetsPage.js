import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import SyncStatusBadge from '../components/SyncStatusBadge';
import datasetService from '../services/dataset';
import datasetGroupService from '../services/datasetGroup';

const emptyUploadState = {
  name: '',
  description: '',
  file: null,
};

const emptyGroupState = {
  name: '',
  description: '',
  dataset_ids: [],
};

const DatasetsPage = () => {
  const { t } = useTranslation('datasets');
  const [activeTab, setActiveTab] = useState('datasets');

  // Datasets State
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState('');

  // Groups State
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');

  // Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadState, setUploadState] = useState(emptyUploadState);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Group Create State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupState, setGroupState] = useState(emptyGroupState);
  const [groupSubmitLoading, setGroupSubmitLoading] = useState(false);

  // Preview State
  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    refreshDatasets();
    refreshGroups();
  }, []);

  const refreshDatasets = async () => {
    setDatasetsLoading(true);
    setDatasetsError('');
    try {
      const response = await datasetService.getAll();
      setDatasets(response.data);
    } catch (err) {
      console.error(err);
      setDatasetsError(t('error.loading'));
    } finally {
      setDatasetsLoading(false);
    }
  };

  const refreshGroups = async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const response = await datasetGroupService.getAll();
      setGroups(response.data);
    } catch (err) {
      console.error(err);
      setGroupsError('Failed to load dataset groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const openPreview = async (dataset) => {
    setPreviewDataset(dataset);
    setPreviewLoading(true);
    setSummaryLoading(true);
    setPreviewData(null);
    setSummaryData(null);
    setPreviewError('');

    try {
      const [previewResp, summaryResp] = await Promise.all([
        datasetService.getPreview(dataset.id),
        datasetService.getSummary(dataset.id),
      ]);
      setPreviewData(previewResp.data);
      setSummaryData(summaryResp.data);
    } catch (err) {
      console.error(err);
      setPreviewError(t('error.preview'));
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
    setDatasetsError('');
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
      setDatasetsError(t('error.upload.file'));
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('name', uploadState.name || uploadState.file.name);
    if (uploadState.description) {
      formData.append('description', uploadState.description);
    }

    setUploadLoading(true);
    setDatasetsError('');
    try {
      await datasetService.upload(formData);
      handleUploadClose();
      await refreshDatasets();
    } catch (err) {
      console.error(err);
      setDatasetsError(t('error.upload.generic'));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGroupClose = () => {
    setShowGroupModal(false);
    setGroupState(emptyGroupState);
    setGroupsError('');
  };

  const handleGroupChange = (event) => {
    const { name, value } = event.target;
    setGroupState((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupDatasetToggle = (datasetId) => {
    setGroupState((prev) => {
      const currentIds = prev.dataset_ids;
      if (currentIds.includes(datasetId)) {
        return { ...prev, dataset_ids: currentIds.filter(id => id !== datasetId) };
      } else {
        return { ...prev, dataset_ids: [...currentIds, datasetId] };
      }
    });
  };

  const handleGroupSubmit = async (event) => {
    event.preventDefault();
    if (groupState.dataset_ids.length < 2) {
      setGroupsError('Please select at least 2 datasets to group.');
      return;
    }

    setGroupSubmitLoading(true);
    setGroupsError('');
    try {
      await datasetGroupService.create(groupState);
      handleGroupClose();
      await refreshGroups();
    } catch (err) {
      console.error(err);
      setGroupsError('Failed to create dataset group');
    } finally {
      setGroupSubmitLoading(false);
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
  }, [previewData, t]);

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
  }, [summaryData, t]);

  return (
    <Layout>
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{t('pageTitle')}</h2>
            <p className="text-muted mb-0">{t('pageTitleDescription')}</p>
          </div>
          <div>
            {activeTab === 'datasets' && (
              <Button variant="primary" onClick={() => setShowUpload(true)}>{t('uploadModal.launchButton')}</Button>
            )}
            {activeTab === 'groups' && (
              <Button variant="primary" onClick={() => setShowGroupModal(true)}>Create Group</Button>
            )}
          </div>
        </div>

        <Tabs
          id="dataset-tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="datasets" title="Datasets">
            {datasetsError && <Alert variant="danger">{datasetsError}</Alert>}

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
                      <Button variant="info" size="sm" onClick={() => openPreview(dataset)} className="me-2">{t('table.actions.preview')}</Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await datasetService.sync(dataset.id);
                            refreshDatasets();
                          } catch (e) {
                            console.error("Sync failed", e);
                            setDatasetsError("Failed to trigger sync");
                          }
                        }}
                        disabled={dataset.metadata?.sync_status === 'syncing'}
                      >
                        {dataset.metadata?.sync_status === 'syncing' ? 'Syncing...' : 'Sync to Databricks'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {datasets.length === 0 && !datasetsLoading && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">{t('table.empty')}</td>
                  </tr>
                )}
              </tbody>
            </Table>
            {datasetsLoading && (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>{t('loading')}</span>
              </div>
            )}
          </Tab>

          <Tab eventKey="groups" title="Dataset Groups">
            {groupsError && <Alert variant="danger">{groupsError}</Alert>}

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Datasets Count</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.description}</td>
                    <td>
                      <Badge bg="secondary">{group.datasets ? group.datasets.length : 0}</Badge>
                    </td>
                    <td>{group.created_at ? new Date(group.created_at).toLocaleString() : '—'}</td>
                    <td>
                      {/* Future: Edit/Delete actions */}
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && !groupsLoading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">No dataset groups found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
            {groupsLoading && (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>Loading groups...</span>
              </div>
            )}
          </Tab>
        </Tabs>

        {/* Upload Modal */}
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
              <Button variant="primary" type="submit" disabled={uploadLoading}>{uploadLoading ? t('uploadModal.actions.uploading') : t('uploadModal.actions.upload')}</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Create Group Modal */}
        <Modal show={showGroupModal} onHide={handleGroupClose} centered size="lg">
          <Form onSubmit={handleGroupSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Create Dataset Group</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Group Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="e.g., Q1 Financials Consolidated"
                  value={groupState.name}
                  onChange={handleGroupChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  placeholder="Optional description"
                  value={groupState.description}
                  onChange={handleGroupChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Select Datasets to Group (Min 2)</Form.Label>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '10px', borderRadius: '4px' }}>
                  {datasets.map(ds => (
                    <Form.Check
                      key={ds.id}
                      type="checkbox"
                      id={`dataset-${ds.id}`}
                      label={`${ds.name} (${ds.row_count} rows)`}
                      checked={groupState.dataset_ids.includes(ds.id)}
                      onChange={() => handleGroupDatasetToggle(ds.id)}
                      className="mb-2"
                    />
                  ))}
                  {datasets.length === 0 && <p className="text-muted">No datasets available.</p>}
                </div>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleGroupClose}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={groupSubmitLoading}>
                {groupSubmitLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Preview Modal */}
        <Modal show={Boolean(previewDataset)} onHide={closePreview} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('previewModal.title')} — {previewDataset?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {previewError && <Alert variant="danger">{previewError}</Alert>}
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
