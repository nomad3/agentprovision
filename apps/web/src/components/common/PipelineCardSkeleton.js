import { Card, Col, Placeholder } from 'react-bootstrap';

const PipelineCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Col key={index}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <Placeholder as="div" animation="glow" className="pipeline-icon-wrapper">
                  <Placeholder xs={6} className="rounded-circle" style={{ width: '32px', height: '32px' }} />
                </Placeholder>
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={4} />
                </Placeholder>
              </div>
              
              <Card.Title>
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={8} />
                </Placeholder>
              </Card.Title>
              
              <Card.Text as="div">
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={6} size="sm" className="mb-1" />
                  <Placeholder xs={8} size="sm" className="mb-1" />
                  <Placeholder xs={5} size="sm" />
                </Placeholder>
              </Card.Text>
              
              <div className="d-flex gap-2 mb-3">
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={4} className="rounded-pill" style={{ height: '20px' }} />
                </Placeholder>
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={6} className="rounded-pill" style={{ height: '20px' }} />
                </Placeholder>
              </div>
              
              <Placeholder as="div" animation="glow">
                <Placeholder xs={12} className="rounded" style={{ height: '32px' }} />
              </Placeholder>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0">
              <Placeholder as="div" animation="glow">
                <Placeholder xs={12} className="rounded" style={{ height: '32px' }} />
              </Placeholder>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </>
  );
};

export default PipelineCardSkeleton;