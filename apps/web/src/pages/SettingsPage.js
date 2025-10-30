import React from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { GearFill, PersonFill, BellFill, ShieldLockFill, CreditCardFill } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import './SettingsPage.css';

const SettingsPage = () => {
  return (
    <Layout>
      <div className="settings-page">
        <div className="page-header">
          <h1 className="page-title">
            <GearFill className="title-icon" />
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
                  <PersonFill className="section-icon" />
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
                  <BellFill className="section-icon" />
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
                  <ShieldLockFill className="section-icon" />
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

          {/* Plan & Billing */}
          <Col md={12}>
            <Card className="settings-card">
              <Card.Body>
                <div className="settings-section-header">
                  <CreditCardFill className="section-icon" />
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
