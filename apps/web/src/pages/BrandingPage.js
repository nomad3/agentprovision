import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { brandingService } from '../services/branding';

function BrandingPage() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const data = await brandingService.getBranding();
      setBranding(data);
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await brandingService.updateBranding(branding);
      setMessage({ type: 'success', text: 'Branding saved successfully!' });
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to save branding' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setBranding({ ...branding, [field]: value });
  };

  if (loading) {
    return <Container className="py-5 text-center">Loading...</Container>;
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Branding Settings</h2>
          <p className="text-muted">Customize your platform's appearance</p>
        </Col>
      </Row>

      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Form onSubmit={handleSave}>
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Brand Identity</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.company_name || ''}
                    onChange={(e) => updateField('company_name', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Logo URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={branding?.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={branding?.support_email || ''}
                    onChange={(e) => updateField('support_email', e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Colors</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Primary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.primary_color || '#6366f1'}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Secondary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.secondary_color || '#8b5cf6'}
                        onChange={(e) => updateField('secondary_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Accent Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.accent_color || '#06b6d4'}
                        onChange={(e) => updateField('accent_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>AI Assistant</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Assistant Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.ai_assistant_name || ''}
                    onChange={(e) => updateField('ai_assistant_name', e.target.value)}
                    placeholder="AI Assistant"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Select
                    value={branding?.industry || ''}
                    onChange={(e) => updateField('industry', e.target.value)}
                  >
                    <option value="">Select industry...</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="legal">Legal</option>
                    <option value="retail">Retail</option>
                    <option value="technology">Technology</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Custom Domain</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Domain</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.custom_domain || ''}
                    onChange={(e) => updateField('custom_domain', e.target.value)}
                    placeholder="app.yourcompany.com"
                  />
                </Form.Group>
                <p className="text-muted small">
                  {branding?.domain_verified
                    ? '✅ Domain verified'
                    : '⚠️ Domain not verified'}
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Form>
    </Container>
  );
}

export default BrandingPage;
