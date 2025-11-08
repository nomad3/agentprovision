import React, { useState } from 'react';
import { Modal, Button, ProgressBar, Alert } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons';
import FileDropZone from './FileDropZone';
import FilePreview from './FilePreview';
import { useToast } from '../common/Toast';
import datasetService from '../../services/dataset';

const EnhancedUploadModal = ({ show, onHide, onSuccess }) => {
  const { success, error } = useToast();
  const [step, setStep] = useState('select'); // select, preview, uploading, success
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setStep('preview');
  };

  const handleDataParsed = (data) => {
    setParsedData(data);
  };

  const handleUpload = async () => {
    if (!selectedFile || !parsedData) return;

    try {
      setStep('uploading');

      // Simulate progress (since actual FormData upload doesn't provide progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', parsedData.name);
      formData.append('description', parsedData.description);

      await datasetService.upload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setStep('success');

      setTimeout(() => {
        success('Dataset uploaded successfully!');
        if (onSuccess) onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      error(`Upload failed: ${err.response?.data?.detail || err.message}`);
      setStep('preview');
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedFile(null);
    setParsedData(null);
    setUploadProgress(0);
    onHide();
  };

  const handleBack = () => {
    setStep('select');
    setSelectedFile(null);
    setParsedData(null);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 'select' && 'Upload Dataset'}
          {step === 'preview' && 'Preview & Confirm'}
          {step === 'uploading' && 'Uploading...'}
          {step === 'success' && 'Upload Complete!'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Step 1: File Selection */}
        {step === 'select' && (
          <FileDropZone onFileSelect={handleFileSelect} />
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && selectedFile && (
          <FilePreview
            file={selectedFile}
            onDataParsed={handleDataParsed}
            defaultName={parsedData?.name}
            defaultDescription={parsedData?.description}
          />
        )}

        {/* Step 3: Uploading */}
        {step === 'uploading' && (
          <div className="text-center py-4">
            <h5 className="mb-3">Uploading {selectedFile?.name}...</h5>
            <ProgressBar
              now={uploadProgress}
              label={`${uploadProgress}%`}
              animated
              className="mb-3"
            />
            <p className="text-muted">
              {uploadProgress < 90
                ? `About ${Math.ceil((100 - uploadProgress) / 10)} seconds remaining...`
                : 'Almost done...'
              }
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center py-4">
            <CheckCircleFill size={64} className="text-success mb-3" />
            <h4>Dataset uploaded successfully!</h4>
            <p className="text-muted">Your data is ready to be analyzed</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 'select' && (
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        )}

        {step === 'preview' && (
          <>
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!parsedData?.name}
            >
              Upload Dataset
            </Button>
          </>
        )}

        {step === 'uploading' && (
          <Button variant="secondary" disabled>
            Uploading...
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EnhancedUploadModal;
