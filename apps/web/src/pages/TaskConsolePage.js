import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Nav,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaClipboardList,
  FaClock,
  FaCog,
  FaCoins,
  FaCopy,
  FaDatabase,
  FaDollarSign,
  FaExclamationTriangle,
  FaPlay,
  FaRobot,
  FaServer,
  FaStream,
  FaSyncAlt,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
import Layout from '../components/Layout';
import TaskTimeline from '../components/TaskTimeline';
import taskService from '../services/taskService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_COLORS = {
  queued: 'secondary',
  thinking: 'info',
  executing: 'warning',
  waiting_input: 'danger',
  completed: 'success',
  failed: 'danger',
  // Temporal statuses
  RUNNING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELED: 'secondary',
  TERMINATED: 'secondary',
  TIMED_OUT: 'danger',
};

const REFRESH_OPTIONS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: 'Off', value: 0 },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'agent_task', label: 'Agent Tasks' },
  { key: 'provision', label: 'Provisioning' },
  { key: 'pipeline', label: 'Data Pipelines' },
  { key: 'sync', label: 'Data Sync' },
];

const TYPE_ICONS = {
  agent_task: FaRobot,
  research: FaRobot,
  analyze: FaRobot,
  generate: FaRobot,
  decide: FaRobot,
  execute: FaRobot,
  OpenClawProvisionWorkflow: FaServer,
  DatasetSyncWorkflow: FaDatabase,
  DataSourceSyncWorkflow: FaSyncAlt,
  ScheduledSyncWorkflow: FaSyncAlt,
  TaskExecutionWorkflow: FaClipboardList,
  KnowledgeExtractionWorkflow: FaDatabase,
  AgentKitExecutionWorkflow: FaRobot,
};

const TYPE_COLORS = {
  agent_task: '#60a5fa',
  OpenClawProvisionWorkflow: '#a78bfa',
  DatasetSyncWorkflow: '#34d399',
  DataSourceSyncWorkflow: '#fbbf24',
  TaskExecutionWorkflow: '#f472b6',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const formatDuration = (startStr, endStr) => {
  if (!startStr) return '-';
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

const truncateId = (id) => {
  if (!id) return '';
  return id.length > 20 ? id.slice(0, 8) + '...' + id.slice(-6) : id;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

const getTypeIcon = (type) => TYPE_ICONS[type] || FaCog;

const matchesTab = (item, tab) => {
  if (tab === 'all') return true;
  if (tab === 'agent_task') return item.source === 'agent_task';
  if (tab === 'provision') return (item.type || '').includes('Provision');
  if (tab === 'pipeline') return (item.type || '').includes('DatasetSync') || (item.type || '').includes('KnowledgeExtraction');
  if (tab === 'sync') return (item.type || '').includes('DataSourceSync') || (item.type || '').includes('ScheduledSync');
  return true;
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card style={{
    background: 'var(--surface-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '1rem',
    flex: 1,
    minWidth: '140px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{
        width: '2.2rem',
        height: '2.2rem',
        borderRadius: '8px',
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={14} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </div>
    {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.3rem' }}>{sub}</div>}
  </Card>
);

// ---------------------------------------------------------------------------
// Workflow Row
// ---------------------------------------------------------------------------
const WorkflowRow = ({ item, isSelected, onClick }) => {
  const IconComp = getTypeIcon(item.type);
  const iconColor = TYPE_COLORS[item.type] || TYPE_COLORS.agent_task;
  const statusColor = STATUS_COLORS[item.status] || 'secondary';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.7rem 0.85rem',
        cursor: 'pointer',
        borderBottom: '1px solid var(--color-border)',
        background: isSelected ? 'var(--surface-contrast)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '2rem',
        height: '2rem',
        borderRadius: '6px',
        background: `${iconColor}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconComp size={12} color={iconColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 500,
          color: 'var(--color-foreground)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.objective || item.type || 'Workflow'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {item.workflow_id && <span title={item.workflow_id}>{truncateId(item.workflow_id)}</span>}
          {item.task_id && <span title={item.task_id}>{truncateId(item.task_id)}</span>}
          <span>{timeAgo(item.start_time)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {(item.tokens_used > 0) && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
            {item.tokens_used?.toLocaleString()} tok
          </span>
        )}
        {(item.cost > 0) && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
            ${item.cost?.toFixed(4)}
          </span>
        )}
        <Badge bg={statusColor} style={{ fontSize: '0.68rem', fontWeight: 500, textTransform: 'capitalize', minWidth: '60px', textAlign: 'center' }}>
          {formatStatus(item.status)}
        </Badge>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', minWidth: '48px', textAlign: 'right' }}>
          {formatDuration(item.start_time, item.close_time)}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Metadata Grid
// ---------------------------------------------------------------------------
const MetadataGrid = ({ item }) => {
  const cells = [
    { label: 'Started', value: item.start_time ? new Date(item.start_time).toLocaleString() : '-' },
    { label: 'Completed', value: item.close_time ? new Date(item.close_time).toLocaleString() : '-' },
    { label: 'Duration', value: formatDuration(item.start_time, item.close_time) },
    { label: 'Type', value: item.type || '-' },
    { label: 'Priority', value: item.priority || '-' },
    item.confidence != null
      ? { label: 'Confidence', value: `${(item.confidence * 100).toFixed(0)}%` }
      : { label: 'Trace Steps', value: item.trace_count ?? item.history_length ?? '-' },
    { label: 'Tokens', value: item.tokens_used ? item.tokens_used.toLocaleString() : '-' },
    { label: 'Cost', value: item.cost ? `$${item.cost.toFixed(4)}` : '-' },
    item.error
      ? { label: 'Error', value: item.error, isError: true }
      : { label: 'Source', value: item.source === 'temporal' ? 'Temporal Workflow' : 'Agent Task' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.6rem',
      marginBottom: '1.25rem',
    }}>
      {cells.map((cell) => (
        <div key={cell.label} style={{
          background: 'var(--surface-contrast)',
          borderRadius: '6px',
          padding: '0.5rem 0.7rem',
          border: cell.isError ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.15rem' }}>
            {cell.label}
          </div>
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 500,
            color: cell.isError ? '#f87171' : 'var(--color-foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
const TaskConsolePage = () => {
  // Data state
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selection & detail
  const [selectedItem, setSelectedItem] = useState(null);
  const [traces, setTraces] = useState([]);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [showRawOutput, setShowRawOutput] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshInterval, setRefreshInterval] = useState(10000);

  const intervalRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchWorkflows = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await taskService.listWorkflows(params);
      setWorkflows(res.data?.workflows || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await taskService.getWorkflowStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchTrace = useCallback(async (taskId) => {
    try {
      const res = await taskService.getTrace(taskId);
      setTraces(res.data?.steps || res.data || []);
    } catch {
      setTraces([]);
    }
  }, []);

  const fetchWorkflowHistory = useCallback(async (workflowId) => {
    try {
      const res = await taskService.getWorkflowHistory(workflowId);
      setWorkflowHistory(res.data?.events || []);
    } catch {
      setWorkflowHistory([]);
    }
  }, []);

  const selectItem = useCallback((item) => {
    setSelectedItem(item);
    setShowRawOutput(false);
    if (item?.task_id) {
      fetchTrace(item.task_id);
    } else {
      setTraces([]);
    }
    if (item?.workflow_id) {
      fetchWorkflowHistory(item.workflow_id);
    } else {
      setWorkflowHistory([]);
    }
  }, [fetchTrace, fetchWorkflowHistory]);

  const handleApprove = async (taskId, e) => {
    e.stopPropagation();
    try {
      await taskService.approve(taskId);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to approve task:', err);
    }
  };

  const handleReject = async (taskId, e) => {
    e.stopPropagation();
    try {
      await taskService.reject(taskId);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to reject task:', err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchWorkflows();
    fetchStats();
  };

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchWorkflows();
    fetchStats();
  }, [fetchWorkflows, fetchStats]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchWorkflows();
        fetchStats();
      }, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchWorkflows, fetchStats]);

  // ---------------------------------------------------------------------------
  // Filtered & sorted workflows
  // ---------------------------------------------------------------------------
  const filteredWorkflows = useMemo(() => {
    let items = workflows.filter((w) => matchesTab(w, activeTab));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((w) =>
        (w.objective || '').toLowerCase().includes(q) ||
        (w.workflow_id || '').toLowerCase().includes(q) ||
        (w.task_id || '').toLowerCase().includes(q) ||
        (w.type || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'oldest') items = [...items].reverse();
    if (sortBy === 'duration') {
      items = [...items].sort((a, b) => {
        const dA = a.start_time && a.close_time ? new Date(a.close_time) - new Date(a.start_time) : 0;
        const dB = b.start_time && b.close_time ? new Date(b.close_time) - new Date(b.start_time) : 0;
        return dB - dA;
      });
    }
    if (sortBy === 'cost') items = [...items].sort((a, b) => (b.cost || 0) - (a.cost || 0));
    return items;
  }, [workflows, activeTab, searchQuery, sortBy]);

  // Combine traces and workflow history for the timeline
  const combinedTraces = useMemo(() => {
    if (traces.length > 0) return traces;
    // Convert workflow history events to trace-like objects for TaskTimeline
    return workflowHistory.map((evt) => ({
      step_type: evt.activity_name || evt.event_type,
      details: evt.details,
      duration_ms: evt.duration_ms,
      created_at: evt.timestamp,
    }));
  }, [traces, workflowHistory]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout>
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}>
          <div>
            <h4 style={{ color: 'var(--color-foreground)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Workflow Audit Dashboard
            </h4>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', margin: 0 }}>
              Monitor Temporal workflows, agent tasks, and execution traces
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Form.Select
              size="sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{
                width: '80px',
                background: 'var(--surface-elevated)',
                color: 'var(--color-soft)',
                border: '1px solid var(--color-border)',
                fontSize: '0.75rem',
              }}
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <FaSyncAlt className={loading ? 'fa-spin' : ''} style={{ marginRight: '0.3rem' }} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          overflowX: 'auto',
        }}>
          <StatCard icon={FaStream} label="Total Workflows" value={stats?.total_workflows ?? '-'} color="#60a5fa" />
          <StatCard icon={FaPlay} label="Running" value={stats?.running_count ?? '-'} color="#fbbf24" />
          <StatCard icon={FaCheckCircle} label="Completed" value={stats?.completed_count ?? '-'} color="#34d399" />
          <StatCard icon={FaTimesCircle} label="Failed" value={stats?.failed_count ?? '-'} color="#f87171" />
          <StatCard icon={FaCoins} label="Total Tokens" value={stats?.total_tokens ?? '-'} color="#a78bfa" />
          <StatCard icon={FaDollarSign} label="Total Cost" value={stats?.total_cost != null ? `$${stats.total_cost.toFixed(2)}` : '-'} color="#f472b6" />
        </div>

        <Row>
          {/* Left column: Workflow list */}
          <Col md={5}>
            <Card style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
            }}>
              {/* Tabs */}
              <div style={{
                borderBottom: '1px solid var(--color-border)',
                padding: '0 0.5rem',
                background: 'var(--surface-contrast)',
                borderRadius: '10px 10px 0 0',
              }}>
                <Nav variant="tabs" style={{ borderBottom: 'none' }}>
                  {TABS.map((tab) => (
                    <Nav.Item key={tab.key}>
                      <Nav.Link
                        active={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: activeTab === tab.key ? 'var(--color-foreground)' : 'var(--color-muted)',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: activeTab === tab.key ? '2px solid #60a5fa' : '2px solid transparent',
                          padding: '0.6rem 0.7rem',
                          borderRadius: 0,
                        }}
                      >
                        {tab.label}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </div>

              {/* Filters */}
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                padding: '0.5rem 0.65rem',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <Form.Control
                  size="sm"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--surface-contrast)',
                    color: 'var(--color-soft)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                  }}
                />
                <Form.Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '110px',
                    background: 'var(--surface-contrast)',
                    color: 'var(--color-soft)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                  }}
                >
                  <option value="">All Status</option>
                  <option value="queued">Queued</option>
                  <option value="executing">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Form.Select>
                <Form.Select
                  size="sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100px',
                    background: 'var(--surface-contrast)',
                    color: 'var(--color-soft)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="duration">Duration</option>
                  <option value="cost">Cost</option>
                </Form.Select>
              </div>

              {/* Workflow list */}
              <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
                {loading && workflows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    <Spinner animation="border" size="sm" style={{ marginRight: '0.5rem' }} />
                    Loading workflows...
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    No workflows found
                  </div>
                ) : (
                  filteredWorkflows.map((item, idx) => (
                    <WorkflowRow
                      key={item.workflow_id || item.task_id || idx}
                      item={item}
                      isSelected={
                        (selectedItem?.workflow_id && selectedItem.workflow_id === item.workflow_id) ||
                        (selectedItem?.task_id && selectedItem.task_id === item.task_id)
                      }
                      onClick={() => selectItem(item)}
                    />
                  ))
                )}
              </div>

              {/* Footer count */}
              <div style={{
                padding: '0.4rem 0.75rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.72rem',
                color: 'var(--color-muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>{filteredWorkflows.length} of {workflows.length} workflows</span>
                {stats?.temporal_available === false && (
                  <span style={{ color: '#fbbf24' }}>
                    <FaExclamationTriangle size={10} style={{ marginRight: '0.2rem' }} />
                    Temporal offline — showing DB data only
                  </span>
                )}
              </div>
            </Card>
          </Col>

          {/* Right column: Detail panel */}
          <Col md={7}>
            <Card style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
            }}>
              <Card.Header style={{
                background: 'var(--surface-contrast)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Workflow Detail</span>
                {selectedItem?.status === 'waiting_input' && selectedItem?.task_id && (
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <Button variant="outline-success" size="sm" onClick={(e) => handleApprove(selectedItem.task_id, e)} style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                      <FaCheck size={10} style={{ marginRight: '0.2rem' }} /> Approve
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={(e) => handleReject(selectedItem.task_id, e)} style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                      <FaTimes size={10} style={{ marginRight: '0.2rem' }} /> Reject
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body style={{ padding: '1.25rem', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
                {!selectedItem ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    <FaClipboardList size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div>Select a workflow to view details and execution trace</div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{
                        color: 'var(--color-foreground)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        marginBottom: '0.5rem',
                      }}>
                        {selectedItem.objective || selectedItem.type || 'Untitled Workflow'}
                      </h5>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge bg={STATUS_COLORS[selectedItem.status] || 'secondary'} style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize', padding: '0.3rem 0.6rem' }}>
                          {formatStatus(selectedItem.status)}
                        </Badge>
                        <Badge bg="dark" style={{ fontSize: '0.72rem', fontWeight: 400, padding: '0.25rem 0.5rem' }}>
                          {selectedItem.type || 'agent_task'}
                        </Badge>
                        {selectedItem.workflow_id && (
                          <Badge
                            bg="dark"
                            style={{ fontSize: '0.7rem', fontWeight: 400, padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                            onClick={() => copyToClipboard(selectedItem.workflow_id)}
                            title="Click to copy workflow ID"
                          >
                            <FaCopy size={9} style={{ marginRight: '0.25rem' }} />
                            {truncateId(selectedItem.workflow_id)}
                          </Badge>
                        )}
                        {selectedItem.task_id && (
                          <Badge
                            bg="dark"
                            style={{ fontSize: '0.7rem', fontWeight: 400, padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                            onClick={() => copyToClipboard(selectedItem.task_id)}
                            title="Click to copy task ID"
                          >
                            <FaCopy size={9} style={{ marginRight: '0.25rem' }} />
                            Task: {truncateId(selectedItem.task_id)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <MetadataGrid item={selectedItem} />

                    {/* Pipeline Run info */}
                    {selectedItem.pipeline_run && (
                      <div style={{
                        background: 'var(--surface-contrast)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid var(--color-border)',
                      }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.3rem' }}>
                          <FaDatabase size={10} style={{ marginRight: '0.3rem' }} />
                          Pipeline Run
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-foreground)' }}>
                          Status: <Badge bg={STATUS_COLORS[selectedItem.pipeline_run.status] || 'secondary'} style={{ fontSize: '0.68rem' }}>{selectedItem.pipeline_run.status}</Badge>
                          {selectedItem.pipeline_run.error && (
                            <span style={{ color: '#f87171', marginLeft: '0.5rem', fontSize: '0.78rem' }}>{selectedItem.pipeline_run.error}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Execution Timeline */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <h6 style={{
                        color: 'var(--color-muted)',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <FaClock size={12} />
                        Execution Trace
                        {combinedTraces.length > 0 && (
                          <Badge bg="info" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
                            {combinedTraces.length} steps
                          </Badge>
                        )}
                      </h6>
                      <TaskTimeline traces={combinedTraces} />
                    </div>

                    {/* Raw Output (collapsible) */}
                    {(selectedItem.source === 'agent_task') && (
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <div
                          onClick={() => setShowRawOutput(!showRawOutput)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                            color: 'var(--color-muted)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {showRawOutput ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                          Raw Data
                        </div>
                        {showRawOutput && (
                          <pre style={{
                            background: 'var(--surface-contrast)',
                            borderRadius: '6px',
                            padding: '0.75rem',
                            marginTop: '0.5rem',
                            fontSize: '0.72rem',
                            color: 'var(--color-soft)',
                            fontFamily: '"SF Mono", "Fira Code", monospace',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {JSON.stringify(selectedItem, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default TaskConsolePage;
