import React, { useEffect, useState } from 'react';
import { Card, Table, Form, Badge, Alert } from 'react-bootstrap';
import { FiletypeCsv, FiletypeXlsx, CheckCircleFill } from 'react-bootstrap-icons';
import Papa from 'papaparse';
import './FilePreview.css';

const FilePreview = ({ file, onDataParsed, defaultName, defaultDescription }) => {
  const [previewData, setPreviewData] = useState(null);
  const [parsing, setParsing] = useState(true);
  const [parseError, setParseError] = useState(null);
  const [name, setName] = useState(defaultName || '');
  const [description, setDescription] = useState(defaultDescription || '');

  useEffect(() => {
    parseFile();
  }, [file]);

  const parseFile = () => {
    setParsing(true);
    setParseError(null);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        preview: 5, // Only parse first 5 rows
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsing(false);
          if (results.errors.length > 0) {
            setParseError(results.errors[0].message);
          } else {
            setPreviewData({
              rows: results.data,
              columns: results.meta.fields,
              totalRows: results.data.length,
            });

            // Auto-populate name and description
            const autoName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            const autoDesc = `Uploaded on ${new Date().toLocaleDateString()} • ${results.meta.fields?.length || 0} columns`;

            setName(autoName);
            setDescription(autoDesc);

            onDataParsed({
              name: autoName,
              description: autoDesc,
              previewData: results.data,
              columns: results.meta.fields,
            });
          }
        },
        error: (error) => {
          setParsing(false);
          setParseError(error.message);
        },
      });
    } else {
      // For Excel files, just show file info (parsing requires additional library)
      setParsing(false);
      const autoName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const autoDesc = `Uploaded on ${new Date().toLocaleDateString()}`;
      setName(autoName);
      setDescription(autoDesc);
      onDataParsed({ name: autoName, description: autoDesc });
    }
  };

  const handleNameChange = (newName) => {
    setName(newName);
    onDataParsed({ ...previewData, name: newName, description });
  };

  const handleDescriptionChange = (newDesc) => {
    setDescription(newDesc);
    onDataParsed({ ...previewData, name, description: newDesc });
  };

  const getFileIcon = () => {
    if (file.name.endsWith('.csv')) return <FiletypeCsv size={32} className="text-success" />;
    return <FiletypeXlsx size={32} className="text-primary" />;
  };

  return (
    <div className="file-preview">
      {/* File Info */}
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex align-items-center gap-3">
            {getFileIcon()}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2">
                <strong>{file.name}</strong>
                <CheckCircleFill className="text-success" size={16} />
              </div>
              <small className="text-muted">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Parsing State */}
      {parsing && (
        <Alert variant="info">
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Analyzing file...</span>
          </div>
        </Alert>
      )}

      {/* Parse Error */}
      {parseError && (
        <Alert variant="danger">
          Failed to parse file: {parseError}
        </Alert>
      )}

      {/* Preview Table */}
      {!parsing && previewData && (
        <>
          <Card className="mb-3">
            <Card.Header>
              <strong>Preview</strong>
              <Badge bg="secondary" className="ms-2">
                First 5 rows
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    {previewData.columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx}>
                      {previewData.columns.map((col, colIdx) => (
                        <td key={colIdx}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Dataset Info Form */}
          <Card>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Dataset Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Revenue 2024"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Brief description of this dataset"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default FilePreview;
