import React, { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const BasicInfoStep = ({ data, onChange, onValidationChange }) => {
  const [validation, setValidation] = useState({
    name: true,
    isValid: false
  });

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange(updated);

    // Validate name
    if (field === 'name') {
      const isValidName = value.length >= 3 && value.length <= 50;
      const newValidation = { ...validation, name: isValidName, isValid: isValidName };
      setValidation(newValidation);

      // Notify parent of validation state
      if (onValidationChange) {
        onValidationChange(newValidation.isValid);
      }
    }
  };

  // Validate on mount
  useEffect(() => {
    const isValidName = data.name.length >= 3 && data.name.length <= 50;
    const newValidation = { name: isValidName, isValid: isValidName };
    setValidation(newValidation);
    if (onValidationChange) {
      onValidationChange(newValidation.isValid);
    }
  }, []);

  return (
    <div className="basic-info-step">
      <h3 className="mb-2">Tell us about your agent</h3>
      <p className="text-muted mb-4">Give your agent a name and description</p>

      <Form>
        <Form.Group className="mb-4" controlId="agentName">
          <Form.Label>Name *</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Support Bot, Sales Assistant Sally"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            isInvalid={!validation.name && data.name.length > 0}
            required
            aria-label="Name"
          />
          {!validation.name && data.name.length > 0 && (
            <Form.Control.Feedback type="invalid">
              Name must be at least 3 characters and no more than 50 characters
            </Form.Control.Feedback>
          )}
          <Form.Text className="text-muted">
            Give your agent a memorable name
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4" controlId="agentDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="What will this agent help with?"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            maxLength={500}
            aria-label="Description"
          />
          <Form.Text className="text-muted">
            {data.description.length}/500 characters
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Avatar (Optional)</Form.Label>
          <div className="avatar-selector">
            <Row className="g-2">
              {['🤖', '👨‍💼', '👩‍💻', '🎧', '📊', '✍️', '🎯', '💡'].map((emoji) => (
                <Col xs={3} sm={2} key={emoji}>
                  <div
                    className={`avatar-option ${data.avatar === emoji ? 'selected' : ''}`}
                    onClick={() => handleChange('avatar', emoji)}
                    style={{ cursor: 'pointer', fontSize: '2rem', textAlign: 'center', padding: '10px', border: data.avatar === emoji ? '2px solid #0d6efd' : '2px solid transparent', borderRadius: '8px' }}
                  >
                    {emoji}
                  </div>
                </Col>
              ))}
            </Row>
          </div>
          <Form.Text className="text-muted">
            Choose an emoji to represent your agent
          </Form.Text>
        </Form.Group>
      </Form>
    </div>
  );
};

export default BasicInfoStep;
