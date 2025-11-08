import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUploadFill, FiletypeXlsx, FiletypeCsv, XCircleFill } from 'react-bootstrap-icons';
import { Alert } from 'react-bootstrap';
import './FileDropZone.css';

const FileDropZone = ({ onFileSelect, acceptedFileTypes = '.csv,.xlsx,.xls', maxSizeMB = 50 }) => {
  const [error, setError] = useState(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a CSV or Excel file.');
      } else {
        setError('File upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
    }
  }, [onFileSelect, maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: maxSizeBytes,
    multiple: false,
  });

  return (
    <div className="file-drop-zone-container">
      <div
        {...getRootProps()}
        className={`file-drop-zone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        <CloudUploadFill size={64} className="upload-icon mb-3" />
        <h5 className="mb-2">
          {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
        </h5>
        <p className="text-muted mb-3">or click to browse</p>
        <div className="supported-formats d-flex gap-3 justify-content-center">
          <div className="format-badge">
            <FiletypeCsv size={24} />
            <small>CSV</small>
          </div>
          <div className="format-badge">
            <FiletypeXlsx size={24} />
            <small>Excel</small>
          </div>
        </div>
        <small className="text-muted mt-3 d-block">Maximum file size: {maxSizeMB}MB</small>
      </div>

      {error && (
        <Alert variant="danger" className="mt-3" dismissible onClose={() => setError(null)}>
          <XCircleFill className="me-2" />
          {error}
        </Alert>
      )}
    </div>
  );
};

export default FileDropZone;
