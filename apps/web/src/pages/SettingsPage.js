import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaCog, FaUser, FaBell, FaShieldAlt, FaCreditCard, FaCloud } from 'react-icons/fa';
import Layout from '../components/Layout';
import api from '../services/api';
import './SettingsPage.css';

const SettingsPage = () => {
  const [databricksStatus, setDatabricksStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDatabricksStatus();
  }, []);

  const fetchDatabricksStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await api.get('/databricks/status');
      setDatabricksStatus(response.data);
    } catch (err) {
      console.error('Error fetching Databricks status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setMessage(null);
      const response = await api.post('/databricks/initialize');
      setMessage({ type: 'success', text: 'Databricks catalog initialized successfully!' });
      fetchDatabricksStatus(); // Refresh status
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.detail || 'Failed to initialize Databricks. Please try again.'
      });
    } finally {
      setInitializing(false);
    }
  };

  return (
    <Layout>
      <div className="settings-page">
        <div className="page-header">
          <h1 className="page-title">
            <FaCog className="title-icon" />
            Settings
          </h1>
          <p className="page-subtitle">Manage your account and application preferences</p>
        </div>

        <Row className="g-4">
          {/* Profile Settings */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <FaUser className="section-icon" />
                  <h3 className="section-title">Profile Settings</h3>
                </div>
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control type="text" placeholder="John Doe" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" placeholder="john@example.com" disabled />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Organization</Form.Label>
                        <Form.Control type="text" placeholder="My Company Inc." />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="settings-actions">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Notification Settings */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <FaBell className="section-icon" />
                  <h3 className="section-title">Notification Preferences</h3>
                </div>
                <Form>
                  <Form.Check
                    type="switch"
                    id="email-notifications"
                    label="Email notifications for important updates"
                    className="settings-switch"
                    defaultChecked
                  />
                  <Form.Check
                    type="switch"
                    id="data-alerts"
                    label="Alerts when data processing completes"
                    className="settings-switch"
                    defaultChecked
                  />
                  <Form.Check
                    type="switch"
                    id="ai-insights"
                    label="Weekly AI insights summary"
                    className="settings-switch"
                  />
                  <Form.Check
                    type="switch"
                    id="system-updates"
                    label="System maintenance and updates"
                    className="settings-switch"
                    defaultChecked
                  />
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Security Settings */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <FaShieldAlt className="section-icon" />
                  <h3 className="section-title">Security</h3>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <strong>Password</strong>
                    <p className="security-text">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline-primary" size="sm">Change Password</Button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <strong>Two-Factor Authentication</strong>
                    <p className="security-text">
                      <Badge bg="warning">Not Enabled</Badge> Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline-primary" size="sm">Enable 2FA</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Databricks Integration */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <FaCloud className="section-icon" />
                  <h3 className="section-title">Databricks Integration</h3>
                </div>

                {message && (
                  <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="mb-3">
                    {message.text}
                  </Alert>
                )}

                {loadingStatus ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" /> Loading Databricks status...
                  </div>
                ) : databricksStatus ? (
                  <>
                    <div className="security-item">
                      <div className="security-info">
                        <strong>MCP Server Connection</strong>
                        <p className="security-text">
                          {databricksStatus.enabled ? (
                            <>
                              {databricksStatus.mcp_server?.healthy ? (
                                <Badge bg="success">Connected</Badge>
                              ) : (
                                <Badge bg="warning">Pending Setup</Badge>
                              )}
                              {' '}Server: {databricksStatus.mcp_server?.url}
                            </>
                          ) : (
                            <Badge bg="secondary">Disabled</Badge>
                          )}
                        </p>
                      </div>
                    </div>

                    {databricksStatus.enabled && (
                      <>
                        <div className="security-item">
                          <div className="security-info">
                            <strong>Unity Catalog</strong>
                            <p className="security-text">
                              {databricksStatus.tenant_catalog?.exists ? (
                                <>
                                  <Badge bg="success">Initialized</Badge>
                                  {' '}Catalog: {databricksStatus.tenant_catalog?.catalog_name}
                                  {databricksStatus.tenant_catalog?.schemas &&
                                    ` (${databricksStatus.tenant_catalog.schemas.length} schemas)`}
                                </>
                              ) : (
                                <>
                                  <Badge bg="warning">Not Initialized</Badge>
                                  {' '}Set up your Databricks workspace
                                </>
                              )}
                            </p>
                          </div>
                          {!databricksStatus.tenant_catalog?.exists && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={handleInitialize}
                              disabled={initializing}
                            >
                              {initializing ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Initializing...
                                </>
                              ) : (
                                'Initialize Catalog'
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="security-item">
                          <div className="security-info">
                            <strong>Available Capabilities</strong>
                            <p className="security-text">
                              {databricksStatus.capabilities && (
                                <div className="d-flex gap-2 flex-wrap mt-2">
                                  {databricksStatus.capabilities.datasets && <Badge bg="info">Datasets</Badge>}
                                  {databricksStatus.capabilities.notebooks && <Badge bg="info">Notebooks</Badge>}
                                  {databricksStatus.capabilities.jobs && <Badge bg="info">Jobs</Badge>}
                                  {databricksStatus.capabilities.model_serving && <Badge bg="info">Model Serving</Badge>}
                                  {databricksStatus.capabilities.vector_search && <Badge bg="info">Vector Search</Badge>}
                                </div>
                              )}
                            </p>
                          </div>
                        </div>

                        {databricksStatus.mcp_server?.error && (
                          <Alert variant="warning" className="mb-0 mt-3">
                            <strong>Connection Issue:</strong> {databricksStatus.mcp_server.error}
                            <br />
                            <small>Please contact support if this persists.</small>
                          </Alert>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <Alert variant="info">Unable to load Databricks status</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Plan & Billing */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <FaCreditCard className="section-icon" />
                  <h3 className="section-title">Plan & Billing</h3>
                </div>
                <div className="plan-info">
                  <div className="current-plan">
                    <div>
                      <h4 className="plan-name">Professional Plan</h4>
                      <p className="plan-description">Unlimited users, 100GB storage, Priority support</p>
                    </div>
                    <Badge bg="success" className="plan-badge">Active</Badge>
                  </div>
                  <div className="billing-details">
                    <div className="billing-item">
                      <span className="billing-label">Next billing date:</span>
                      <span className="billing-value">January 1, 2026</span>
                    </div>
                    <div className="billing-item">
                      <span className="billing-label">Amount:</span>
                      <span className="billing-value">$99/month</span>
                    </div>
                  </div>
                  <div className="settings-actions">
                    <Button variant="outline-primary">Manage Subscription</Button>
                    <Button variant="link">View Billing History</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default SettingsPage;
