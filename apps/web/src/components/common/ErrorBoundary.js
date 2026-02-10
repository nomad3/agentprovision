import { Component } from 'react';
import { Alert, Button, Card, Container } from 'react-bootstrap';
import { FaRedo as ArrowClockwise, FaBug as BugFill } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <BugFill className="me-2" />
              Something went wrong
            </Card.Header>
            <Card.Body>
              <Alert variant="danger" className="mb-4">
                <Alert.Heading>Oops! Something unexpected happened</Alert.Heading>
                <p>
                  We encountered an error while loading this page. This has been logged 
                  and our team will investigate. Please try refreshing the page.
                </p>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Error ID: {Date.now().toString(36).toUpperCase()}
                  </small>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={this.handleRetry}
                  >
                    <ArrowClockwise className="me-1" />
                    Try Again
                  </Button>
                </div>
              </Alert>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-muted mb-2" style={{cursor: 'pointer'}}>
                    Developer Details (Development Mode)
                  </summary>
                  <Card style={{ background: 'var(--surface-contrast)' }}>
                    <Card.Body>
                      <h6>Error:</h6>
                      <pre className="small text-danger">
                        {this.state.error && this.state.error.toString()}
                      </pre>
                      <h6>Stack Trace:</h6>
                      <pre className="small" style={{fontSize: '0.7rem'}}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Card.Body>
                  </Card>
                </details>
              )}
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;