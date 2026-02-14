import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Spinner,
  Table
} from 'react-bootstrap';
import {
  FaCheck,
  FaDatabase,
  FaSyncAlt,
  FaTimes
} from 'react-icons/fa';
import Layout from '../components/Layout';
import TaskTimeline from '../components/TaskTimeline';
import api from '../services/api';
import taskService from '../services/taskService';

const STATUS_COLORS = {
  queued: 'secondary',
  thinking: 'info',
  executing: 'warning',
  waiting_input: 'danger',
  completed: 'success',
  failed: 'danger',
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
};

const TaskConsolePage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionSummary, setCollectionSummary] = useState(null);
  const intervalRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await taskService.getAll();
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrace = useCallback(async (taskId) => {
    try {
      const res = await taskService.getTrace(taskId);
      setTraces(res.data?.steps || res.data || []);
    } catch (err) {
      console.error('Failed to fetch trace:', err);
      setTraces([]);
    }
  }, []);

  const selectTask = useCallback((task) => {
    setSelectedTask(task);
    if (task?.id) {
      fetchTrace(task.id);
    } else {
      setTraces([]);
    }
  }, [fetchTrace]);

  const handleApprove = async (taskId, e) => {
    e.stopPropagation();
    try {
      await taskService.approve(taskId);
      fetchTasks();
      if (selectedTask?.id === taskId) {
        fetchTrace(taskId);
      }
    } catch (err) {
      console.error('Failed to approve task:', err);
    }
  };

  const handleReject = async (taskId, e) => {
    e.stopPropagation();
    try {
      await taskService.reject(taskId);
      fetchTasks();
      if (selectedTask?.id === taskId) {
        fetchTrace(taskId);
      }
    } catch (err) {
      console.error('Failed to reject task:', err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchTasks();
    if (selectedTask?.id) {
      fetchTrace(selectedTask.id);
    }
  };

  useEffect(() => {
    fetchTasks();
    intervalRef.current = setInterval(fetchTasks, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTasks]);

  useEffect(() => {
    if (selectedTask?.id && selectedTask?.context?.config?.entity_type) {
      api.get(`/knowledge/collections/${selectedTask.id}/summary`)
        .then(res => setCollectionSummary(res.data))
        .catch(() => setCollectionSummary(null));
    } else {
      setCollectionSummary(null);
    }
  }, [selectedTask]);

  return (
    <Layout>
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <div>
            <h4 style={{ color: 'var(--color-foreground)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Task Execution Console
            </h4>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', margin: 0 }}>
              Monitor agent task execution and approve pending actions
            </p>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FaSyncAlt className={loading ? 'fa-spin' : ''} style={{ marginRight: '0.4rem' }} />
            Refresh
          </Button>
        </div>

        <Row>
          {/* Left column: Tasks list */}
          <Col md={5}>
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
              }}>
                Tasks ({tasks.length})
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {loading && tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    <Spinner animation="border" size="sm" style={{ marginRight: '0.5rem' }} />
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    No tasks found
                  </div>
                ) : (
                  <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                    <Table hover responsive size="sm" style={{ margin: 0, color: 'var(--color-soft)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.65rem 0.75rem' }}>Objective</th>
                          <th style={{ color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.65rem 0.75rem' }}>Type</th>
                          <th style={{ color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.65rem 0.75rem' }}>Priority</th>
                          <th style={{ color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.65rem 0.75rem' }}>Status</th>
                          <th style={{ color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.65rem 0.75rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => selectTask(task)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--color-border)',
                              background: selectedTask?.id === task.id ? 'var(--surface-contrast)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.objective || task.description || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem' }}>
                              {task.task_type || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem' }}>
                              {task.priority || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <Badge bg={STATUS_COLORS[task.status] || 'secondary'} style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                {formatStatus(task.status)}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              {task.status === 'waiting_input' && (
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={(e) => handleApprove(task.id, e)}
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                  >
                                    <FaCheck size={10} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={(e) => handleReject(task.id, e)}
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                  >
                                    <FaTimes size={10} />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right column: Task detail */}
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
              }}>
                Task Detail
              </Card.Header>
              <Card.Body style={{ padding: '1.25rem', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                {!selectedTask ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    Select a task to view details and execution trace
                  </div>
                ) : (
                  <>
                    {/* Objective */}
                    <h5 style={{
                      color: 'var(--color-foreground)',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      fontSize: '1rem',
                    }}>
                      {selectedTask.objective || selectedTask.description || 'Untitled Task'}
                    </h5>

                    {/* Metadata badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {selectedTask.task_type && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem' }}>
                          Type: {selectedTask.task_type}
                        </Badge>
                      )}
                      {selectedTask.priority && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem' }}>
                          Priority: {selectedTask.priority}
                        </Badge>
                      )}
                      {selectedTask.confidence != null && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem' }}>
                          Confidence: {(selectedTask.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                      {selectedTask.tokens_used != null && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem' }}>
                          Tokens: {selectedTask.tokens_used.toLocaleString()}
                        </Badge>
                      )}
                      {selectedTask.estimated_cost != null && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem' }}>
                          Cost: ${selectedTask.estimated_cost.toFixed(4)}
                        </Badge>
                      )}
                      <Badge bg={STATUS_COLORS[selectedTask.status] || 'secondary'} style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.6rem', textTransform: 'capitalize' }}>
                        {formatStatus(selectedTask.status)}
                      </Badge>
                    </div>

                    {/* Entity Collection Summary */}
                    {selectedTask?.context?.config?.entity_type && (
                      <div style={{
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: '1rem',
                        marginBottom: '1rem',
                      }}>
                        <h6 style={{
                          color: 'var(--color-muted)',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}>
                          <FaDatabase size={12} />
                          Collected Entities
                          {collectionSummary && (
                            <Badge bg="info" style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: '0.3rem' }}>
                              {collectionSummary.total_entities}
                            </Badge>
                          )}
                        </h6>
                        {collectionSummary ? (
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                              {Object.entries(collectionSummary.by_status || {}).map(([status, count]) => (
                                <Badge
                                  key={status}
                                  bg={status === 'verified' ? 'success' : status === 'draft' ? 'warning' : 'secondary'}
                                  style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.25rem 0.5rem' }}
                                >
                                  {status}: {count}
                                </Badge>
                              ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {Object.entries(collectionSummary.by_type || {}).map(([type, count]) => (
                                <Badge
                                  key={type}
                                  bg="light"
                                  text="dark"
                                  style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.25rem 0.5rem' }}
                                >
                                  {type}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <small style={{ color: 'var(--color-muted)' }}>No entities collected yet</small>
                        )}
                      </div>
                    )}

                    {/* Execution Trace */}
                    <div style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '1rem',
                    }}>
                      <h6 style={{
                        color: 'var(--color-muted)',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1rem',
                        fontWeight: 600,
                      }}>
                        Execution Trace
                      </h6>
                      <TaskTimeline traces={traces} />
                    </div>
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
