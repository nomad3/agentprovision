import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { CheckCircleFill, LockFill } from 'react-bootstrap-icons';
import './QuickStartCard.css';

const QuickStartCard = ({
  step,
  title,
  description,
  icon: Icon,
  completed,
  locked,
  lockedMessage,
  primaryAction,
  secondaryAction,
  statusText,
  isActive,
}) => {
  return (
    <Card className={`quick-start-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''} ${isActive ? 'active' : ''}`}>
      <Card.Body className="d-flex flex-column align-items-center text-center p-4">
        {/* Step Number Badge */}
        <div className="step-badge mb-3">
          {completed ? (
            <CheckCircleFill size={32} className="text-success" />
          ) : locked ? (
            <LockFill size={32} className="text-muted" />
          ) : (
            <span className="step-number">{step}</span>
          )}
        </div>

        {/* Icon */}
        <div className="card-icon mb-3">
          <Icon size={48} className={locked ? 'text-muted' : 'text-primary'} />
        </div>

        {/* Title */}
        <h4 className="card-title mb-2">{title}</h4>

        {/* Description */}
        <p className="card-description text-muted mb-3">{description}</p>

        {/* Status Text */}
        {statusText && (
          <div className="status-text mb-3">
            {statusText}
          </div>
        )}

        {/* Locked Message */}
        {locked && lockedMessage && (
          <div className="locked-message text-muted mb-3">
            <small>{lockedMessage}</small>
          </div>
        )}

        {/* Actions */}
        {!locked && (
          <div className="card-actions w-100">
            {primaryAction && (
              <Button
                variant={completed ? 'outline-primary' : 'primary'}
                size="lg"
                onClick={primaryAction.onClick}
                className="w-100 mb-2"
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={secondaryAction.onClick}
                className="w-100"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </Card.Body>

      {/* Connecting Arrow (shown on desktop) */}
      {!locked && step < 3 && (
        <div className="card-arrow">→</div>
      )}
    </Card>
  );
};

export default QuickStartCard;
