import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <Card className="error-boundary-card">
            <Card.Body className="text-center p-5">
              <div className="error-boundary-icon mb-4">
                <ExclamationTriangleFill size={64} />
              </div>
              <h2 className="error-boundary-title mb-3">Something went wrong</h2>
              <p className="error-boundary-description mb-4">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-boundary-details mb-4">
                  <summary className="error-boundary-summary">Error Details</summary>
                  <pre className="error-boundary-stack">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="error-boundary-actions">
                <Button variant="primary" onClick={this.handleReset}>
                  Reload Page
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => (window.location.href = '/')}
                  className="ms-2"
                >
                  Go Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
