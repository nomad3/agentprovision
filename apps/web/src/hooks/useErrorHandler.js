import { useState, useCallback } from 'react';

const ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You are not authorized. Please log in and try again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  422: 'The data provided is invalid. Please check your input.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Server error. Please try again later or contact support.',
  502: 'Service temporarily unavailable. Please try again in a moment.',
  503: 'Service temporarily unavailable. Please try again later.'
};

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err, context = '') => {
    console.error(`Error in ${context}:`, err);
    
    let errorMessage = 'An unexpected error occurred.';
    let isRetryable = false;
    let statusCode = null;

    if (err?.response?.status) {
      statusCode = err.response.status;
      errorMessage = ERROR_MESSAGES[statusCode] || errorMessage;
      
      // Network errors and 5xx errors are usually retryable
      isRetryable = statusCode >= 500 || statusCode === 429;
    } else if (err?.message) {
      errorMessage = err.message;
      // Network errors (no response) are retryable
      isRetryable = !err.response;
    }

    // Add context to error message if provided
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }

    const errorObj = {
      message: errorMessage,
      statusCode,
      isRetryable,
      originalError: err,
      timestamp: new Date().toISOString()
    };

    setError(errorObj);
    return errorObj;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (retryFunction) => {
    if (!retryFunction || typeof retryFunction !== 'function') {
      console.warn('No retry function provided');
      return;
    }

    setIsRetrying(true);
    setError(null);
    
    try {
      await retryFunction();
    } catch (err) {
      handleError(err, 'Retry failed');
    } finally {
      setIsRetrying(false);
    }
  }, [handleError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry
  };
};

export default useErrorHandler;