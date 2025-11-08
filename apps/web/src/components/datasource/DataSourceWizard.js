import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ConnectorSelector from './ConnectorSelector';
import './DataSourceWizard.css';

const DataSourceWizard = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    connector: null,
    connectionDetails: {},
    syncSettings: {},
  });

  const handleConnectorSelect = (connector) => {
    // If file upload, redirect to upload modal
    if (connector.id === 'file_upload') {
      onHide();
      // Trigger upload modal (handled by parent)
      return;
    }

    setWizardData({ ...wizardData, connector });
    setCurrentStep(2);
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setWizardData({ connector: null, connectionDetails: {}, syncSettings: {} });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleCancel} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Connect Data Source</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {currentStep === 1 && (
          <ConnectorSelector
            onSelect={handleConnectorSelect}
            selectedConnector={wizardData.connector?.id}
          />
        )}

        {currentStep === 2 && (
          <div className="text-center text-muted py-5">
            Step 2: Connection details form (to be implemented)
          </div>
        )}

        {currentStep === 3 && (
          <div className="text-center text-muted py-5">
            Step 3: Sync configuration (to be implemented)
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DataSourceWizard;
