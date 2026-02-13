import { useEffect, useState, useCallback } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaPause,
  FaPlay,
  FaRocket,
  FaServer,
  FaSyncAlt,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import instanceService from '../services/instanceService';

const STATUS_CONFIG = {
  provisioning: { bg: 'info', icon: FaSyncAlt, text: 'Provisioning', spin: true },
  running: { bg: 'success', icon: FaCheckCircle, text: 'Running', spin: false },
  stopped: { bg: 'secondary', icon: FaPause, text: 'Stopped', spin: false },
  upgrading: { bg: 'info', icon: FaSyncAlt, text: 'Upgrading', spin: true },
  error: { bg: 'danger', icon: FaTimesCircle, text: 'Error', spin: false },
  destroying: { bg: 'warning', icon: FaSyncAlt, text: 'Destroying', spin: true },
};

const OpenClawInstanceCard = () => {
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await instanceService.getAll();
      const instances = res.data || [];
      setInstance(instances.length > 0 ? instances[0] : null);
      setError(null);
    } catch (err) {
      // 404 or empty is fine -- means no instance yet
      if (err.response?.status !== 404) {
        console.error('Failed to fetch instance:', err);
      }
      setInstance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  // Poll while in a transient status
  useEffect(() => {
    if (!instance) return;
    const transient = ['provisioning', 'upgrading', 'destroying'];
    if (!transient.includes(instance.status)) return;

    const interval = setInterval(fetchInstance, 5000);
    return () => clearInterval(interval);
  }, [instance, fetchInstance]);

  const handleDeploy = async () => {
    try {
      setActionLoading('deploy');
      setError(null);
      const res = await instanceService.create({
        instance_type: 'openclaw',
        k8s_namespace: 'prod',
      });
      setInstance(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deploy instance');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action) => {
    if (!instance) return;
    try {
      setActionLoading(action);
      setError(null);
      if (action === 'destroy') {
        if (!window.confirm('Are you sure you want to destroy this OpenClaw instance? This cannot be undone.')) {
          setActionLoading(null);
          return;
        }
        await instanceService.destroy(instance.id);
        setInstance(null);
      } else {
        const res = await instanceService[action](instance.id);
        setInstance(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} instance`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (createdAt) => {
    if (!createdAt) return 'N/A';
    const diff = Date.now() - new Date(createdAt).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.error;
    const Icon = config.icon;
    return (
      <Badge bg={config.bg} className="d-inline-flex align-items-center gap-1">
        {config.spin ? (
          <Spinner animation="border" size="sm" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
        ) : (
          <Icon size={10} />
        )}
        {config.text}
      </Badge>
    );
  };

  // ---- Not Deployed state ----
  const renderNotDeployed = () => (
    <Card.Body className="text-center py-4">
      <FaServer size={36} className="text-muted mb-3" />
      <h6 style={{ color: 'var(--color-foreground)' }}>No OpenClaw Instance</h6>
      <p className="text-muted small mb-3">
        Deploy a dedicated OpenClaw instance to enable document processing and entity extraction for your portfolio.
      </p>
      <Button
        variant="primary"
        onClick={handleDeploy}
        disabled={actionLoading === 'deploy'}
      >
        {actionLoading === 'deploy' ? (
          <><Spinner size="sm" className="me-2" />Deploying...</>
        ) : (
          <><FaRocket className="me-2" />Deploy OpenClaw Instance</>
        )}
      </Button>
    </Card.Body>
  );

  // ---- Provisioning / Upgrading / Destroying (transient) ----
  const renderTransient = () => (
    <Card.Body className="text-center py-4">
      <Spinner animation="border" variant="primary" className="mb-3" />
      <h6 style={{ color: 'var(--color-foreground)' }}>
        {instance.status === 'provisioning' && 'Deploying OpenClaw Instance...'}
        {instance.status === 'upgrading' && 'Upgrading OpenClaw Instance...'}
        {instance.status === 'destroying' && 'Destroying OpenClaw Instance...'}
      </h6>
      <p className="text-muted small mb-0">
        This may take a few minutes. The page will update automatically.
      </p>
    </Card.Body>
  );

  // ---- Running state ----
  const renderRunning = () => (
    <Card.Body>
      <Row className="align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h6 className="mb-0" style={{ color: 'var(--color-foreground)' }}>
              OpenClaw Instance
            </h6>
            {renderStatusBadge(instance.status)}
          </div>
          <div className="d-flex gap-4 text-muted small">
            {instance.version && <span>Version: <strong>{instance.version}</strong></span>}
            <span>Uptime: <strong>{formatUptime(instance.created_at)}</strong></span>
            {instance.k8s_namespace && <span>Namespace: <strong>{instance.k8s_namespace}</strong></span>}
            {instance.resource_config?.cpu_limit && (
              <span>CPU: <strong>{instance.resource_config.cpu_limit}</strong></span>
            )}
            {instance.resource_config?.memory_limit && (
              <span>Memory: <strong>{instance.resource_config.memory_limit}</strong></span>
            )}
          </div>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => handleAction('stop')}
            disabled={!!actionLoading}
            title="Stop instance"
          >
            {actionLoading === 'stop' ? <Spinner size="sm" /> : <><FaPause className="me-1" />Stop</>}
          </Button>
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => handleAction('restart')}
            disabled={!!actionLoading}
            title="Restart instance"
          >
            {actionLoading === 'restart' ? <Spinner size="sm" /> : <><FaSyncAlt className="me-1" />Restart</>}
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleAction('destroy')}
            disabled={!!actionLoading}
            title="Destroy instance"
          >
            {actionLoading === 'destroy' ? <Spinner size="sm" /> : <><FaTrash className="me-1" />Destroy</>}
          </Button>
        </Col>
      </Row>
    </Card.Body>
  );

  // ---- Stopped state ----
  const renderStopped = () => (
    <Card.Body>
      <Row className="align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h6 className="mb-0" style={{ color: 'var(--color-foreground)' }}>
              OpenClaw Instance
            </h6>
            {renderStatusBadge('stopped')}
          </div>
          <p className="text-muted small mb-0">
            Instance is stopped. Start it to resume operations.
          </p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => handleAction('start')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'start' ? <Spinner size="sm" /> : <><FaPlay className="me-1" />Start</>}
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleAction('destroy')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'destroy' ? <Spinner size="sm" /> : <><FaTrash className="me-1" />Destroy</>}
          </Button>
        </Col>
      </Row>
    </Card.Body>
  );

  // ---- Error state ----
  const renderError = () => (
    <Card.Body>
      <Row className="align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h6 className="mb-0" style={{ color: 'var(--color-foreground)' }}>
              OpenClaw Instance
            </h6>
            {renderStatusBadge('error')}
          </div>
          {instance.error && (
            <p className="text-danger small mb-0">
              <FaExclamationTriangle className="me-1" />
              {instance.error}
            </p>
          )}
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleDeploy}
            disabled={!!actionLoading}
          >
            {actionLoading === 'deploy' ? <Spinner size="sm" /> : <><FaRocket className="me-1" />Retry Deploy</>}
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleAction('destroy')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'destroy' ? <Spinner size="sm" /> : <><FaTrash className="me-1" />Destroy</>}
          </Button>
        </Col>
      </Row>
    </Card.Body>
  );

  const renderBody = () => {
    if (!instance) return renderNotDeployed();
    switch (instance.status) {
      case 'provisioning':
      case 'upgrading':
      case 'destroying':
        return renderTransient();
      case 'running':
        return renderRunning();
      case 'stopped':
        return renderStopped();
      case 'error':
        return renderError();
      default:
        return renderNotDeployed();
    }
  };

  if (loading) {
    return (
      <Card
        className="mb-4"
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          background: 'var(--surface-elevated)',
        }}
      >
        <Card.Body className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card
      className="mb-4"
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        background: 'var(--surface-elevated)',
        boxShadow: '0 2px 15px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Card.Header
        style={{
          background: 'transparent',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.75rem 1.25rem',
        }}
      >
        <h6 className="mb-0 d-flex align-items-center" style={{ color: 'var(--color-foreground)' }}>
          <FaServer className="me-2" />
          OpenClaw Instance
        </h6>
      </Card.Header>
      {error && (
        <Alert variant="danger" className="m-3 mb-0" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {renderBody()}
    </Card>
  );
};

export default OpenClawInstanceCard;
