import { Alert, Button } from 'react-bootstrap';
import { FaRedo as ArrowClockwise, FaExclamationTriangle as ExclamationTriangleFill, FaInfoCircle as InfoCircleFill } from 'react-icons/fa';

const EnhancedErrorAlert = ({ 
  error, 
  onRetry, 
  onDismiss, 
  retrying = false,
  className = '',
  ...props 
}) => {
  if (!error) return null;

  const getVariant = () => {
    if (error.statusCode === 404) return 'warning';
    if (error.statusCode >= 500) return 'danger';
    if (error.statusCode === 401 || error.statusCode === 403) return 'warning';
    return 'danger';
  };

  const getIcon = () => {
    const variant = getVariant();
    if (variant === 'warning') return <ExclamationTriangleFill className="me-2" />;
    return <InfoCircleFill className="me-2" />;
  };

  return (
    <Alert 
      variant={getVariant()} 
      className={`d-flex justify-content-between align-items-center ${className}`}
      {...props}
    >
      <div>
        {getIcon()}
        <span>{error.message}</span>
        {error.statusCode && (
          <small className="text-muted ms-2">
            (Error {error.statusCode})
          </small>
        )}
      </div>
      
      <div className="d-flex gap-2">
        {error.isRetryable && onRetry && (
          <Button
            variant={`outline-${getVariant()}`}
            size="sm"
            onClick={onRetry}
            disabled={retrying}
          >
            <ArrowClockwise className={`me-1 ${retrying ? 'spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
        {onDismiss && (
          <Button
            variant={`outline-${getVariant()}`}
            size="sm"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default EnhancedErrorAlert;