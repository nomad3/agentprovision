import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ConnectorCard = ({ connector }) => {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title>{connector.name}</Card.Title>
        <Card.Text>{connector.description}</Card.Text>
        <Link to={`/integrations/new/${connector.id}`}>
          <Button variant="primary">Configure</Button>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default ConnectorCard;