import { Card } from 'react-bootstrap';

const PremiumCard = ({ children, className = '', ...props }) => {
  return (
    <Card className={`glass-card border-0 ${className}`} {...props}>
      {children}
    </Card>
  );
};

export default PremiumCard;
