import React from 'react';
import { Card } from 'react-bootstrap';
import './EmptyState.css';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  return (
    <Card className={`empty-state-card empty-state-${variant}`}>
      <Card.Body className="text-center p-5">
        {Icon && (
          <div className="empty-state-icon mb-4">
            <Icon size={64} />
          </div>
        )}
        <h4 className="empty-state-title mb-3">{title}</h4>
        {description && (
          <p className="empty-state-description mb-4">{description}</p>
        )}
        {action && (
          <div className="empty-state-action">
            {action}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmptyState;
