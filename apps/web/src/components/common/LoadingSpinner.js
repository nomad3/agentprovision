import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', text, fullScreen = false }) => {
  const sizeMap = {
    sm: { width: '1.5rem', height: '1.5rem' },
    md: { width: '2.5rem', height: '2.5rem' },
    lg: { width: '4rem', height: '4rem' },
  };

  const spinnerContent = (
    <div className={`loading-spinner-container ${fullScreen ? 'loading-fullscreen' : ''}`}>
      <div className="loading-spinner-content">
        <Spinner
          animation="border"
          variant="primary"
          style={sizeMap[size]}
          className="loading-spinner-animated"
        />
        {text && <p className="loading-spinner-text mt-3">{text}</p>}
      </div>
    </div>
  );

  return spinnerContent;
};

export const SkeletonLoader = ({ rows = 3, height = 60 }) => {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="skeleton-item"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
