import React from 'react';
import { Badge, Spinner } from 'react-bootstrap';

/**
 * Display Databricks sync status with visual indicators
 *
 * @param {object} props
 * @param {string} props.status - One of: synced, syncing, failed, pending, null
 * @returns {JSX.Element}
 */
const SyncStatusBadge = ({ status }) => {
  if (!status) {
    return <Badge bg="secondary">Local Only</Badge>;
  }

  const statusConfig = {
    synced: {
      bg: 'success',
      icon: '✓',
      text: 'Synced to Databricks'
    },
    syncing: {
      bg: 'warning',
      icon: <Spinner animation="border" size="sm" />,
      text: 'Syncing...'
    },
    failed: {
      bg: 'danger',
      icon: '⚠️',
      text: 'Sync Failed'
    },
    pending: {
      bg: 'info',
      icon: '○',
      text: 'Pending Sync'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge bg={config.bg} className="d-flex align-items-center gap-1">
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </Badge>
  );
};

export default SyncStatusBadge;
