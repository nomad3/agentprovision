import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast as BSToast, ToastContainer } from 'react-bootstrap';
import {
  FaCheckCircle as CheckCircleFill,
  FaExclamationTriangle as ExclamationTriangleFill,
  FaInfoCircle as InfoCircleFill,
  FaTimesCircle as XCircleFill,
} from 'react-icons/fa';
import './Toast.css';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => addToast(message, 'success', duration),
    [addToast]
  );

  const error = useCallback(
    (message, duration) => addToast(message, 'danger', duration),
    [addToast]
  );

  const warning = useCallback(
    (message, duration) => addToast(message, 'warning', duration),
    [addToast]
  );

  const info = useCallback(
    (message, duration) => addToast(message, 'info', duration),
    [addToast]
  );

  const icons = {
    success: CheckCircleFill,
    danger: XCircleFill,
    warning: ExclamationTriangleFill,
    info: InfoCircleFill,
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3 toast-container-custom">
        {toasts.map((toast) => {
          const Icon = icons[toast.variant] || InfoCircleFill;
          return (
            <BSToast
              key={toast.id}
              onClose={() => removeToast(toast.id)}
              className={`toast-custom toast-${toast.variant}`}
              animation
            >
              <BSToast.Header closeButton className="toast-header-custom">
                <Icon className="toast-icon me-2" size={18} />
                <strong className="me-auto">
                  {toast.variant === 'success' && 'Success'}
                  {toast.variant === 'danger' && 'Error'}
                  {toast.variant === 'warning' && 'Warning'}
                  {toast.variant === 'info' && 'Info'}
                </strong>
              </BSToast.Header>
              <BSToast.Body className="toast-body-custom">
                {toast.message}
              </BSToast.Body>
            </BSToast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
