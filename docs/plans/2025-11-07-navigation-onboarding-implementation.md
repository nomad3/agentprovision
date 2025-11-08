# Navigation & Onboarding Improvements - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement dashboard quick start cards, menu tooltips, enhanced file upload with drag-and-drop, and data source connection wizard to solve navigation confusion.

**Architecture:** Add Quick Start section to Dashboard, enhance Layout with tooltips, create FileDropZone component, build DataSourceWizard following agent wizard pattern, track progress in localStorage.

**Tech Stack:** React 18, React Bootstrap, React Dropzone, React Router v7, existing API services

---

## Task 1: Add Menu Tooltips to Sidebar

**Files:**
- Modify: `apps/web/src/components/Layout.js`

**Step 1: Add descriptions to nav items**

Modify the `navSections` array in Layout.js:

```javascript
const navSections = [
  {
    title: 'INSIGHTS',
    items: [
      {
        path: '/home',
        icon: HouseDoorFill,
        label: 'Home',
        description: 'Your personalized homepage and quick start guide'
      },
      {
        path: '/dashboard',
        icon: BarChartFill,
        label: 'Dashboard',
        description: 'Platform analytics and activity overview'
      },
      {
        path: '/datasets',
        icon: FileTextFill,
        label: 'Reports & Data',
        description: 'Upload files and view your datasets'
      },
    ]
  },
  {
    title: 'AI ASSISTANT',
    items: [
      {
        path: '/chat',
        icon: ChatDotsFill,
        label: 'Ask AI',
        description: 'Chat with your AI agents and get insights'
      },
      {
        path: '/agents',
        icon: Robot,
        label: 'AI Assistants',
        description: 'Create and manage your AI agents'
      },
      {
        path: '/agent-kits',
        icon: Grid3x3GapFill,
        label: 'AI Templates',
        description: 'Save and reuse agent configurations'
      },
    ]
  },
  {
    title: 'WORKSPACE',
    items: [
      {
        path: '/data-sources',
        icon: PlugFill,
        label: 'Data Connections',
        description: 'Connect to databases and external tools'
      },
      {
        path: '/data-pipelines',
        icon: DatabaseFill,
        label: 'Automations',
        description: 'Set up automated data pipelines and workflows'
      },
      {
        path: '/tenants',
        icon: BuildingFill,
        label: 'Organization',
        description: 'Manage teams and permissions'
      },
      {
        path: '/settings',
        icon: GearFill,
        label: 'Settings',
        description: 'Configure your account preferences'
      },
    ]
  }
];
```

**Step 2: Add OverlayTrigger to nav links**

Update the nav link rendering:

```javascript
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

// In the map function:
{section.items.map((item) => {
  const Icon = item.icon;
  return (
    <OverlayTrigger
      key={item.path}
      placement="right"
      delay={{ show: 500, hide: 0 }}
      overlay={<Tooltip id={`tooltip-${item.path}`}>{item.description}</Tooltip>}
    >
      <Nav.Link
        as={Link}
        to={item.path}
        className={`sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
      >
        <Icon className="nav-icon" size={20} />
        <span className="nav-label">{item.label}</span>
        {item.badge && (
          <Badge bg="primary" className="nav-badge">{item.badge}</Badge>
        )}
      </Nav.Link>
    </OverlayTrigger>
  );
})}
```

**Step 3: Build and verify**

```bash
cd apps/web
npm run build
```

Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add apps/web/src/components/Layout.js
git commit -m "feat: add descriptive tooltips to sidebar navigation

- Add description field to all nav items
- Wrap nav links with OverlayTrigger
- Show helpful tooltips on 500ms hover delay
- Clarify what each menu item does for new users

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Quick Start Card Component

**Files:**
- Create: `apps/web/src/components/dashboard/QuickStartCard.js`
- Create: `apps/web/src/components/dashboard/QuickStartCard.css`

**Step 1: Create QuickStartCard component**

Create `apps/web/src/components/dashboard/QuickStartCard.js`:

```javascript
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { CheckCircleFill, LockFill } from 'react-bootstrap-icons';
import './QuickStartCard.css';

const QuickStartCard = ({
  step,
  title,
  description,
  icon: Icon,
  completed,
  locked,
  lockedMessage,
  primaryAction,
  secondaryAction,
  statusText,
  isActive,
}) => {
  return (
    <Card className={`quick-start-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''} ${isActive ? 'active' : ''}`}>
      <Card.Body className="d-flex flex-column align-items-center text-center p-4">
        {/* Step Number Badge */}
        <div className="step-badge mb-3">
          {completed ? (
            <CheckCircleFill size={32} className="text-success" />
          ) : locked ? (
            <LockFill size={32} className="text-muted" />
          ) : (
            <span className="step-number">{step}</span>
          )}
        </div>

        {/* Icon */}
        <div className="card-icon mb-3">
          <Icon size={48} className={locked ? 'text-muted' : 'text-primary'} />
        </div>

        {/* Title */}
        <h4 className="card-title mb-2">{title}</h4>

        {/* Description */}
        <p className="card-description text-muted mb-3">{description}</p>

        {/* Status Text */}
        {statusText && (
          <div className="status-text mb-3">
            {statusText}
          </div>
        )}

        {/* Locked Message */}
        {locked && lockedMessage && (
          <div className="locked-message text-muted mb-3">
            <small>{lockedMessage}</small>
          </div>
        )}

        {/* Actions */}
        {!locked && (
          <div className="card-actions w-100">
            {primaryAction && (
              <Button
                variant={completed ? 'outline-primary' : 'primary'}
                size="lg"
                onClick={primaryAction.onClick}
                className="w-100 mb-2"
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={secondaryAction.onClick}
                className="w-100"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </Card.Body>

      {/* Connecting Arrow (shown on desktop) */}
      {!locked && step < 3 && (
        <div className="card-arrow">→</div>
      )}
    </Card>
  );
};

export default QuickStartCard;
```

**Step 2: Create styles**

Create `apps/web/src/components/dashboard/QuickStartCard.css`:

```css
.quick-start-card {
  position: relative;
  border-radius: 16px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  min-height: 320px;
}

.quick-start-card.active {
  border-color: #0d6efd;
  box-shadow: 0 8px 24px rgba(13, 110, 253, 0.15);
  animation: pulse-border 2s ease-in-out infinite;
}

.quick-start-card.completed {
  border-color: #198754;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
}

.quick-start-card.locked {
  opacity: 0.6;
  background: #f8f9fa;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(13, 110, 253, 0.15);
  }
  50% {
    box-shadow: 0 8px 32px rgba(13, 110, 253, 0.25);
  }
}

.step-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.quick-start-card.completed .step-badge {
  background: #198754;
}

.quick-start-card.locked .step-badge {
  background: #6c757d;
}

.card-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-start-card.completed .card-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.card-description {
  font-size: 0.95rem;
  line-height: 1.5;
}

.status-text {
  font-size: 0.9rem;
  color: #198754;
  font-weight: 500;
}

.locked-message {
  font-size: 0.85rem;
  font-style: italic;
}

.card-arrow {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  color: #0d6efd;
  font-weight: bold;
}

/* Mobile */
@media (max-width: 768px) {
  .card-arrow {
    display: none;
  }

  .quick-start-card {
    margin-bottom: 20px;
  }
}
```

**Step 3: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/
git commit -m "feat: create quick start card component

- Create reusable QuickStartCard component
- Support completed, locked, and active states
- Add pulse animation for active cards
- Include connecting arrows for flow visualization
- Mobile-responsive with stacked layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Quick Start Section to Dashboard

**Files:**
- Create: `apps/web/src/components/dashboard/QuickStartSection.js`
- Modify: `apps/web/src/pages/DashboardPage.js`

**Step 1: Create QuickStartSection component**

Create `apps/web/src/components/dashboard/QuickStartSection.js`:

```javascript
import React, { useEffect, useState } from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  CloudUploadFill,
  RobotFill,
  ChatDotsFill
} from 'react-bootstrap-icons';
import QuickStartCard from './QuickStartCard';
import datasetService from '../../services/dataset';
import agentService from '../../services/agent';
import chatService from '../../services/chat';

const QuickStartSection = ({ onUploadClick, onConnectClick }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({
    hasData: false,
    dataCount: 0,
    hasAgents: false,
    agentCount: 0,
    hasChats: false,
    chatCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    try {
      setLoading(true);
      const [datasetsResp, agentsResp, chatsResp] = await Promise.all([
        datasetService.getAll(),
        agentService.getAll(),
        chatService.getSessions(),
      ]);

      setProgress({
        hasData: (datasetsResp.data?.length || 0) > 0,
        dataCount: datasetsResp.data?.length || 0,
        hasAgents: (agentsResp.data?.length || 0) > 0,
        agentCount: agentsResp.data?.length || 0,
        hasChats: (chatsResp.data?.length || 0) > 0,
        chatCount: chatsResp.data?.length || 0,
      });
    } catch (error) {
      console.error('Error checking progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="quick-start-section mb-5">
        <h3 className="text-center mb-4">Getting Started</h3>
        <div className="text-center text-muted">Loading...</div>
      </Container>
    );
  }

  // Hide section if all steps completed
  if (progress.hasData && progress.hasAgents && progress.hasChats) {
    return null;
  }

  return (
    <Container className="quick-start-section mb-5">
      <div className="text-center mb-4">
        <h3>Quick Start Guide</h3>
        <p className="text-muted">
          Get started in 3 simple steps
        </p>
      </div>

      <Row className="justify-content-center g-4">
        {/* Card 1: Connect Your Data */}
        <Col md={4}>
          <QuickStartCard
            step={1}
            title="Connect Your Data"
            description="Upload a file or connect to your data sources"
            icon={CloudUploadFill}
            completed={progress.hasData}
            locked={false}
            isActive={!progress.hasData}
            statusText={
              progress.hasData
                ? `✓ ${progress.dataCount} dataset${progress.dataCount !== 1 ? 's' : ''} connected`
                : null
            }
            primaryAction={{
              label: progress.hasData ? 'Add More Data' : 'Upload File',
              onClick: onUploadClick,
            }}
            secondaryAction={{
              label: 'Connect Data Source',
              onClick: onConnectClick,
            }}
          />
        </Col>

        {/* Card 2: Create an AI Agent */}
        <Col md={4}>
          <QuickStartCard
            step={2}
            title="Create an AI Agent"
            description="Build an intelligent assistant to analyze your data"
            icon={RobotFill}
            completed={progress.hasAgents}
            locked={!progress.hasData}
            lockedMessage="Complete step 1 first"
            isActive={progress.hasData && !progress.hasAgents}
            statusText={
              progress.hasAgents
                ? `✓ ${progress.agentCount} agent${progress.agentCount !== 1 ? 's' : ''} created`
                : null
            }
            primaryAction={
              progress.hasData
                ? {
                    label: progress.hasAgents ? 'Create Another' : 'Create Agent',
                    onClick: () => navigate('/agents/wizard'),
                  }
                : null
            }
          />
        </Col>

        {/* Card 3: Start Chatting */}
        <Col md={4}>
          <QuickStartCard
            step={3}
            title="Start Chatting"
            description="Ask your AI agent questions about your data"
            icon={ChatDotsFill}
            completed={progress.hasChats}
            locked={!progress.hasAgents}
            lockedMessage="Create an agent first"
            isActive={progress.hasAgents && !progress.hasChats}
            statusText={
              progress.hasChats
                ? `✓ ${progress.chatCount} conversation${progress.chatCount !== 1 ? 's' : ''}`
                : null
            }
            primaryAction={
              progress.hasAgents
                ? {
                    label: 'Start Chatting',
                    onClick: () => navigate('/chat'),
                  }
                : null
            }
          />
        </Col>
      </Row>
    </Container>
  );
};

export default QuickStartSection;
```

**Step 2: Add to DashboardPage**

Modify `apps/web/src/pages/DashboardPage.js`:

Add imports:
```javascript
import QuickStartSection from '../components/dashboard/QuickStartSection';
import { useState } from 'react'; // if not already imported
```

Add state for modals:
```javascript
const [showUploadModal, setShowUploadModal] = useState(false);
const [showConnectModal, setShowConnectModal] = useState(false);
```

Add QuickStartSection at the top of the page content (before analytics charts):
```javascript
<Layout>
  <QuickStartSection
    onUploadClick={() => setShowUploadModal(true)}
    onConnectClick={() => setShowConnectModal(true)}
  />

  {/* Existing analytics content */}
  {/* ... */}
</Layout>
```

**Step 3: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/ apps/web/src/pages/DashboardPage.js
git commit -m "feat: add quick start section to dashboard

- Create QuickStartSection with 3-step guided flow
- Track progress: datasets, agents, chats
- Sequential unlocking: data → agent → chat
- Auto-hide when all steps completed
- Add upload and connect modal hooks

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Drag-and-Drop File Upload Component

**Files:**
- Create: `apps/web/src/components/upload/FileDropZone.js`
- Create: `apps/web/src/components/upload/FileDropZone.css`
- Add dependency: `react-dropzone`

**Step 1: Install react-dropzone**

```bash
cd apps/web
npm install react-dropzone
```

**Step 2: Create FileDropZone component**

Create `apps/web/src/components/upload/FileDropZone.js`:

```javascript
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
```

**Step 3: Create styles**

Create `apps/web/src/components/upload/FileDropZone.css`:

```css
.file-drop-zone {
  border: 3px dashed #dee2e6;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.file-drop-zone:hover {
  border-color: #0d6efd;
  background: #f0f4ff;
}

.file-drop-zone.drag-active {
  border-color: #0d6efd;
  background: #e7f1ff;
  transform: scale(1.02);
}

.upload-icon {
  color: #6c757d;
  transition: all 0.3s ease;
}

.file-drop-zone:hover .upload-icon,
.file-drop-zone.drag-active .upload-icon {
  color: #0d6efd;
  transform: translateY(-5px);
}

.format-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  color: #6c757d;
}

.file-drop-zone:hover .format-badge {
  border-color: #0d6efd;
  color: #0d6efd;
}
```

**Step 4: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/components/upload/
git commit -m "feat: create drag-and-drop file upload component

- Install react-dropzone dependency
- Create FileDropZone component with drag-and-drop
- Add file type and size validation
- Show supported formats (CSV, Excel)
- Highlight drop zone on drag over
- Display error messages for invalid files

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create File Preview Component

**Files:**
- Create: `apps/web/src/components/upload/FilePreview.js`
- Create: `apps/web/src/components/upload/FilePreview.css`

**Step 1: Create FilePreview component**

Create `apps/web/src/components/upload/FilePreview.js`:

```javascript
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
```

**Step 3: Install papaparse dependency**

```bash
npm install papaparse
```

**Step 4: Create styles**

Create `apps/web/src/components/upload/FilePreview.css`:

```css
.file-preview {
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-preview .table {
  font-size: 0.9rem;
}

.file-preview .table th {
  background: #f8f9fa;
  font-weight: 600;
}
```

**Step 5: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/components/upload/
git commit -m "feat: create file preview component with CSV parsing

- Install papaparse for CSV parsing
- Create FilePreview component
- Parse and display first 5 rows
- Auto-populate dataset name from filename
- Auto-generate description with date and column count
- Support CSV and Excel files
- Show file size and type

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Enhanced Upload Modal

**Files:**
- Create: `apps/web/src/components/upload/EnhancedUploadModal.js`
- Modify: `apps/web/src/pages/DashboardPage.js`

**Step 1: Create EnhancedUploadModal component**

Create `apps/web/src/components/upload/EnhancedUploadModal.js`:

```javascript
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
```

**Step 2: Install papaparse**

```bash
npm install papaparse
```

**Step 3: Update DashboardPage to use EnhancedUploadModal**

Modify `apps/web/src/pages/DashboardPage.js`:

```javascript
import EnhancedUploadModal from '../components/upload/EnhancedUploadModal';

// Add to component:
<EnhancedUploadModal
  show={showUploadModal}
  onHide={() => setShowUploadModal(false)}
  onSuccess={() => {
    // Refresh quick start section
    window.location.reload(); // Simple approach, or lift state up
  }}
/>
```

**Step 4: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/components/upload/ apps/web/src/pages/DashboardPage.js
git commit -m "feat: create enhanced upload modal with preview

- Create EnhancedUploadModal with 4 steps
- Integrate FileDropZone and FilePreview
- Add upload progress bar with percentage
- Show success state with checkmark
- Auto-populate name and description
- Install papaparse for CSV parsing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create Data Source Wizard - Step 1 (Connector Selector)

**Files:**
- Create: `apps/web/src/components/datasource/DataSourceWizard.js`
- Create: `apps/web/src/components/datasource/ConnectorSelector.js`
- Create: `apps/web/src/components/datasource/DataSourceWizard.css`

**Step 1: Create ConnectorSelector component**

Create `apps/web/src/components/datasource/ConnectorSelector.js`:

```javascript
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import {
  DatabaseFill,
  FileEarmarkSpreadsheetFill,
  CloudFill,
  PlugFill,
  FileEarmarkArrowUpFill
} from 'react-bootstrap-icons';

const CONNECTORS = [
  {
    id: 'postgresql',
    name: 'PostgreSQL / MySQL',
    icon: DatabaseFill,
    description: 'Connect to your relational database',
    category: 'database',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: FileEarmarkSpreadsheetFill,
    description: 'Sync spreadsheets automatically',
    category: 'cloud',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: CloudFill,
    description: 'Import CRM data',
    category: 'cloud',
  },
  {
    id: 'rest_api',
    name: 'REST API',
    icon: PlugFill,
    description: 'Connect to any API endpoint',
    category: 'api',
  },
  {
    id: 'file_upload',
    name: 'File Upload',
    icon: FileEarmarkArrowUpFill,
    description: 'One-time CSV or Excel import',
    category: 'file',
  },
];

const ConnectorSelector = ({ onSelect, selectedConnector }) => {
  return (
    <div className="connector-selector">
      <h4 className="mb-2">Choose Data Source Type</h4>
      <p className="text-muted mb-4">Select how you want to connect your data</p>

      <Row className="g-3">
        {CONNECTORS.map((connector) => {
          const IconComponent = connector.icon;
          const isSelected = selectedConnector === connector.id;

          return (
            <Col key={connector.id} md={6} lg={4}>
              <Card
                className={`connector-card h-100 ${isSelected ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(connector)}
              >
                <Card.Body className="d-flex flex-column align-items-center text-center">
                  <div className="connector-icon mb-3">
                    <IconComponent size={48} />
                  </div>
                  <Card.Title className="mb-2 h6">{connector.name}</Card.Title>
                  <Card.Text className="text-muted small mb-3 flex-grow-1">
                    {connector.description}
                  </Card.Text>
                  <Button
                    variant={isSelected ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(connector);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export { CONNECTORS };
export default ConnectorSelector;
```

**Step 2: Create DataSourceWizard container**

Create `apps/web/src/components/datasource/DataSourceWizard.js`:

```javascript
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
```

**Step 3: Create styles**

Create `apps/web/src/components/datasource/DataSourceWizard.css`:

```css
.connector-card {
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.connector-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.connector-card.selected {
  border-color: #0d6efd;
  background-color: #f8f9ff;
}

.connector-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
```

**Step 4: Add to DashboardPage**

Modify `apps/web/src/pages/DashboardPage.js`:

```javascript
import DataSourceWizard from '../components/datasource/DataSourceWizard';

// Add to component:
<DataSourceWizard
  show={showConnectModal}
  onHide={() => setShowConnectModal(false)}
/>
```

**Step 5: Build and verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add apps/web/src/components/datasource/ apps/web/src/pages/DashboardPage.js
git commit -m "feat: create data source wizard with connector selector

- Create DataSourceWizard container component
- Add ConnectorSelector for step 1
- Support 5 connector types (Database, Sheets, Salesforce, API, File)
- Redirect file_upload to upload modal
- Add wizard navigation structure
- Style connector cards like agent templates

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Implementation Plan Summary

**This plan provides 7 bite-sized tasks that will:**

1. ✅ Add menu tooltips (Task 1)
2. ✅ Create Quick Start card component (Task 2)
3. ✅ Add Quick Start section to Dashboard (Task 3)
4. ✅ Create drag-and-drop upload (Task 4)
5. ✅ Create file preview with CSV parsing (Task 5)
6. ✅ Build enhanced upload modal (Task 6)
7. ✅ Create data source wizard foundation (Task 7)

**Remaining work (future tasks):**
- Data source connection forms (Step 2 of wizard) - requires backend API endpoints
- Sync configuration (Step 3 of wizard) - requires Temporal workflows
- Post-upload success modal with next actions
- Connection testing endpoint

**Dependencies:**
- New npm packages: `react-dropzone`, `papaparse`
- Backend API may need: `POST /api/v1/data_sources/test` endpoint

The plan follows TDD where applicable and commits after each task.
