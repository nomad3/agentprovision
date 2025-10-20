import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import Layout from '../components/Layout';
import datasetService from '../services/dataset';
import agentKitService from '../services/agentKit';
import chatService from '../services/chat';

const initialSessionState = {
  datasetId: '',
  agentKitId: '',
  title: '',
};

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [agentKits, setAgentKits] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [postingMessage, setPostingMessage] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionForm, setSessionForm] = useState(initialSessionState);
  const [formErrors, setFormErrors] = useState('');
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    loadReferenceData();
    loadSessions();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [datasetsResp, agentKitsResp] = await Promise.all([
        datasetService.getAll(),
        agentKitService.getAll(),
      ]);
      setDatasets(datasetsResp.data);
      setAgentKits(agentKitsResp.data);
    } catch (err) {
      console.error(err);
      setGlobalError('Failed to load supporting data (datasets or agent kits).');
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    setGlobalError('');
    try {
      const response = await chatService.listSessions();
      setSessions(response.data);
      if (response.data.length > 0 && !selectedSession) {
        handleSelectSession(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      setGlobalError('Failed to fetch chat sessions.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await chatService.listMessages(sessionId);
      setMessages(response.data);
    } catch (err) {
      console.error(err);
      setGlobalError('Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    loadMessages(session.id);
  };

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    if (!messageDraft.trim() || !selectedSession) {
      return;
    }
    setPostingMessage(true);
    setGlobalError('');
    try {
      const response = await chatService.postMessage(selectedSession.id, messageDraft.trim());
      setMessages((prev) => [...prev, response.data.user_message, response.data.assistant_message]);
      setMessageDraft('');
    } catch (err) {
      console.error(err);
      setGlobalError('Failed to send message to agent.');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleCreateSessionModal = () => {
    setShowCreateModal(true);
    setSessionForm(initialSessionState);
    setFormErrors('');
  };

  const handleCreateSessionChange = (event) => {
    const { name, value } = event.target;
    setSessionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    if (!sessionForm.datasetId || !sessionForm.agentKitId) {
      setFormErrors('Select both a dataset and an agent kit.');
      return;
    }

    try {
      const response = await chatService.createSession({
        dataset_id: sessionForm.datasetId,
        agent_kit_id: sessionForm.agentKitId,
        title: sessionForm.title ? sessionForm.title.trim() : undefined,
      });
      setSessions((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      setSelectedSession(response.data);
      loadMessages(response.data.id);
    } catch (err) {
      console.error(err);
      setFormErrors('Unable to create chat session. Ensure the selected dataset and agent kit are valid.');
    }
  };

  const datasetById = useMemo(() => {
    return datasets.reduce((acc, dataset) => {
      acc[dataset.id] = dataset;
      return acc;
    }, {});
  }, [datasets]);

  const agentKitById = useMemo(() => {
    return agentKits.reduce((acc, kit) => {
      acc[kit.id] = kit;
      return acc;
    }, {});
  }, [agentKits]);

  const renderMessage = (message) => {
    const timeLabel = message.created_at ? new Date(message.created_at).toLocaleTimeString() : '';
    return (
      <ListGroup.Item key={message.id} className={message.role === 'assistant' ? 'bg-light' : ''}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Badge bg={message.role === 'assistant' ? 'primary' : 'secondary'} className="me-2 text-uppercase">
              {message.role}
            </Badge>
            <span>{message.content}</span>
          </div>
          <small className="text-muted">{timeLabel}</small>
        </div>
        {message.context && message.context.summary && (
          <details className="mt-2">
            <summary>View agent context</summary>
            <pre className="bg-white border rounded p-2 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(message.context, null, 2)}
            </pre>
          </details>
        )}
      </ListGroup.Item>
    );
  };

  return (
    <Layout>
      <Container fluid>
        <Row className="g-4">
          <Col lg={4} xl={3}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="mb-0">Sessions</h3>
              <Button size="sm" variant="outline-primary" onClick={handleCreateSessionModal}>
                New session
              </Button>
            </div>
            {loadingSessions ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner animation="border" size="sm" />
                <span>Loading sessions…</span>
              </div>
            ) : (
              <ListGroup className="shadow-sm">
                {sessions.map((session) => (
                  <ListGroup.Item
                    action
                    key={session.id}
                    active={selectedSession && session.id === selectedSession.id}
                    onClick={() => handleSelectSession(session)}
                  >
                    <div className="fw-semibold">{session.title || 'Untitled session'}</div>
                    <div className="small text-muted">
                      {(datasetById[session.dataset_id] && datasetById[session.dataset_id].name) || 'Dataset'} ·
                      {(agentKitById[session.agent_kit_id] && agentKitById[session.agent_kit_id].name) || 'Agent Kit'}
                    </div>
                  </ListGroup.Item>
                ))}
                {sessions.length === 0 && (
                  <ListGroup.Item className="text-muted text-center">
                    No sessions yet. Create one to start chatting with your data.
                  </ListGroup.Item>
                )}
              </ListGroup>
            )}
          </Col>

          <Col lg={8} xl={9}>
            {globalError && <Alert variant="danger">{globalError}</Alert>}
            {selectedSession ? (
              <Card className="shadow-sm">
                <Card.Header>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h5 className="mb-0">{selectedSession.title || 'Agent session'}</h5>
                      <small className="text-muted">
                        Dataset: {(datasetById[selectedSession.dataset_id] && datasetById[selectedSession.dataset_id].name) || '—'} · Agent Kit:
                        {(agentKitById[selectedSession.agent_kit_id] && agentKitById[selectedSession.agent_kit_id].name) || '—'}
                      </small>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body style={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loadingMessages ? (
                      <div className="d-flex align-items-center gap-2 text-muted">
                        <Spinner animation="border" size="sm" />
                        <span>Loading conversation…</span>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {messages.map((message) => renderMessage(message))}
                        {messages.length === 0 && (
                          <ListGroup.Item className="text-muted text-center">
                            No messages yet. Ask the agent something about the dataset.
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    )}
                  </div>
                  <Form onSubmit={handleMessageSubmit} className="pt-3">
                    <Row className="g-2 align-items-end">
                      <Col xs={12} md={9}>
                        <Form.Group controlId="chatMessage">
                          <Form.Label className="visually-hidden">Message</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ask a question or request an action."
                            value={messageDraft}
                            onChange={(event) => setMessageDraft(event.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={3} className="d-grid">
                        <Button type="submit" variant="primary" disabled={postingMessage || !messageDraft.trim()}>
                          {postingMessage ? 'Sending…' : 'Send'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <Card.Body className="text-center text-muted">
                  <p className="mb-1">Select a session to view the conversation.</p>
                  <p className="mb-0">Need a new one? Click “New session” and choose a dataset plus agent kit.</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreateSession}>
          <Modal.Header closeButton>
            <Modal.Title>Start new agent session</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formErrors && <Alert variant="danger">{formErrors}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                placeholder="Optional label (e.g. Q4 forecast review)"
                value={sessionForm.title}
                onChange={handleCreateSessionChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dataset</Form.Label>
              <Form.Select name="datasetId" value={sessionForm.datasetId} onChange={handleCreateSessionChange} required>
                <option value="">Select dataset…</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Agent Kit</Form.Label>
              <Form.Select name="agentKitId" value={sessionForm.agentKitId} onChange={handleCreateSessionChange} required>
                <option value="">Select agent kit…</option>
                {agentKits.map((kit) => (
                  <option key={kit.id} value={kit.id}>
                    {kit.name} (v{kit.version || '1.0'})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create session
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ChatPage;
