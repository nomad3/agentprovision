import { useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row } from 'react-bootstrap';
import PremiumCard from '../components/common/PremiumCard';
import Layout from '../components/Layout';
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
    return (
      <Layout>
        <Container className="py-5 text-center text-soft">Loading...</Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-2">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-white mb-1">Branding Settings</h2>
            <p className="text-soft mb-0">Customize your platform's appearance</p>
          </Col>
        </Row>

        {message && <Alert variant={message.type}>{message.text}</Alert>}

        <Form onSubmit={handleSave}>
          <Row>
            <Col md={6}>
              <PremiumCard className="mb-4 h-100">
                <div className="mb-4 border-bottom border-secondary border-opacity-25 pb-2">
                  <h5 className="text-white mb-0">Brand Identity</h5>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.company_name || ''}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className="bg-dark text-white border-secondary border-opacity-50"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Logo URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={branding?.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    className="bg-dark text-white border-secondary border-opacity-50"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={branding?.support_email || ''}
                    onChange={(e) => updateField('support_email', e.target.value)}
                    className="bg-dark text-white border-secondary border-opacity-50"
                  />
                </Form.Group>
              </PremiumCard>
            </Col>

            <Col md={6}>
              <PremiumCard className="mb-4 h-100">
                <div className="mb-4 border-bottom border-secondary border-opacity-25 pb-2">
                  <h5 className="text-white mb-0">Colors</h5>
                </div>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-soft">Primary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.primary_color || '#6366f1'}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                        className="bg-dark border-secondary border-opacity-50"
                        style={{ minHeight: '40px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-soft">Secondary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.secondary_color || '#8b5cf6'}
                        onChange={(e) => updateField('secondary_color', e.target.value)}
                        className="bg-dark border-secondary border-opacity-50"
                        style={{ minHeight: '40px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-soft">Accent Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.accent_color || '#06b6d4'}
                        onChange={(e) => updateField('accent_color', e.target.value)}
                        className="bg-dark border-secondary border-opacity-50"
                        style={{ minHeight: '40px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </PremiumCard>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <PremiumCard className="mb-4 h-100">
                <div className="mb-4 border-bottom border-secondary border-opacity-25 pb-2">
                  <h5 className="text-white mb-0">AI Assistant</h5>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Assistant Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.ai_assistant_name || ''}
                    onChange={(e) => updateField('ai_assistant_name', e.target.value)}
                    placeholder="AI Assistant"
                    className="bg-dark text-white border-secondary border-opacity-50"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Industry</Form.Label>
                  <Form.Select
                    value={branding?.industry || ''}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="bg-dark text-white border-secondary border-opacity-50"
                  >
                    <option value="">Select industry...</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="legal">Legal</option>
                    <option value="retail">Retail</option>
                    <option value="technology">Technology</option>
                  </Form.Select>
                </Form.Group>
              </PremiumCard>
            </Col>

            <Col md={6}>
              <PremiumCard className="mb-4 h-100">
                <div className="mb-4 border-bottom border-secondary border-opacity-25 pb-2">
                  <h5 className="text-white mb-0">Custom Domain</h5>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="text-soft">Domain</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.custom_domain || ''}
                    onChange={(e) => updateField('custom_domain', e.target.value)}
                    placeholder="app.yourcompany.com"
                    className="bg-dark text-white border-secondary border-opacity-50"
                  />
                </Form.Group>
                <p className="text-soft small">
                  {branding?.domain_verified
                    ? '✅ Domain verified'
                    : '⚠️ Domain not verified'}
                </p>
              </PremiumCard>
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button type="submit" variant="primary" disabled={saving} size="lg" className="px-5">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Container>
    </Layout>
  );
}

export default BrandingPage;
