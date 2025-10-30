import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />;
  }

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
