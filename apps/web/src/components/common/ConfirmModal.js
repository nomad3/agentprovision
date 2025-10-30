import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ExclamationTriangleFill, InfoCircleFill, CheckCircleFill } from 'react-bootstrap-icons';
import './ConfirmModal.css';

const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, warning, info, success
  confirmLoading = false,
}) => {
  const icons = {
    danger: ExclamationTriangleFill,
    warning: ExclamationTriangleFill,
    info: InfoCircleFill,
    success: CheckCircleFill,
  };

  const Icon = icons[variant] || InfoCircleFill;

  return (
    <Modal show={show} onHide={onHide} centered className="confirm-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100 text-center pt-3">
          <div className={`confirm-modal-icon confirm-modal-icon-${variant} mx-auto`}>
            <Icon size={32} />
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center pt-2">
        <h4 className="confirm-modal-title mb-3">{title}</h4>
        <p className="confirm-modal-message">{message}</p>
      </Modal.Body>
      <Modal.Footer className="border-0 justify-content-center pb-4">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={confirmLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          disabled={confirmLoading}
        >
          {confirmLoading ? 'Processing...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
