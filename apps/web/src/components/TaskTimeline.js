import { Badge } from 'react-bootstrap';
import {
  FaBolt,
  FaBrain,
  FaCheck,
  FaClock,
  FaCog,
  FaExclamationTriangle,
  FaFlagCheckered,
  FaHourglass,
  FaPlay,
  FaRobot,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';

const STEP_ICONS = {
  // DB execution trace types
  dispatched: FaPlay,
  memory_recall: FaBrain,
  executing: FaCog,
  skill_call: FaBolt,
  delegated: FaRobot,
  approval_requested: FaClock,
  approval_granted: FaCheck,
  entity_persist: FaSearch,
  evaluation: FaFlagCheckered,
  completed: FaCheck,
  failed: FaTimes,
  // Temporal workflow event types
  workflow_started: FaPlay,
  workflow_completed: FaFlagCheckered,
  workflow_failed: FaTimes,
  workflow_timed_out: FaHourglass,
  activity_scheduled: FaClock,
  activity_started: FaCog,
  activity_completed: FaCheck,
  activity_failed: FaExclamationTriangle,
  activity_timed_out: FaHourglass,
  // Fallback pattern matching
  agent: FaRobot,
  thinking: FaBrain,
  processing: FaCog,
  success: FaCheck,
  failure: FaTimes,
  waiting: FaClock,
};

const STEP_COLORS = {
  dispatched: '#60a5fa',
  memory_recall: '#a78bfa',
  executing: '#fbbf24',
  skill_call: '#f472b6',
  completed: '#34d399',
  failed: '#f87171',
  workflow_started: '#60a5fa',
  workflow_completed: '#34d399',
  workflow_failed: '#f87171',
  activity_scheduled: '#94a3b8',
  activity_started: '#fbbf24',
  activity_completed: '#34d399',
  activity_failed: '#f87171',
};

const getStepIcon = (stepType) => {
  if (!stepType) return FaCog;
  const normalized = stepType.toLowerCase();
  // Exact match first
  if (STEP_ICONS[normalized]) return STEP_ICONS[normalized];
  // Partial match
  for (const [key, Icon] of Object.entries(STEP_ICONS)) {
    if (normalized.includes(key)) return Icon;
  }
  return FaCog;
};

const getStepColor = (stepType) => {
  if (!stepType) return '#94a3b8';
  const normalized = stepType.toLowerCase();
  return STEP_COLORS[normalized] || '#94a3b8';
};

const formatStepType = (stepType) => {
  if (!stepType) return 'UNKNOWN';
  return stepType.replace(/_/g, ' ').toUpperCase();
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
};

const formatDetails = (details) => {
  if (!details) return null;
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

const formatDurationMs = (ms) => {
  if (!ms && ms !== 0) return null;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

const styles = {
  container: {
    position: 'relative',
    paddingLeft: '2rem',
  },
  line: {
    position: 'absolute',
    left: '0.9rem',
    top: 0,
    bottom: 0,
    width: '2px',
    background: 'var(--color-border, #2d333b)',
  },
  step: {
    position: 'relative',
    marginBottom: '1.25rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
  },
  iconWrapper: (color) => ({
    position: 'absolute',
    left: '-2rem',
    top: '0.15rem',
    width: '1.8rem',
    height: '1.8rem',
    borderRadius: '50%',
    background: `${color}18`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${color}40`,
    zIndex: 1,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--color-foreground, #f8fafc)',
    letterSpacing: '0.03em',
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'var(--color-muted, rgba(148,163,184,0.72))',
    marginLeft: 'auto',
  },
  activityName: {
    fontSize: '0.75rem',
    color: 'var(--color-soft, rgba(226,232,240,0.9))',
    fontWeight: 500,
    background: 'var(--surface-contrast, #2d333b)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  details: {
    background: 'var(--surface-elevated, #22272e)',
    borderRadius: '6px',
    padding: '0.65rem 0.85rem',
    fontSize: '0.78rem',
    color: 'var(--color-soft, rgba(226,232,240,0.9))',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid var(--color-border, rgba(255,255,255,0.06))',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--color-muted, rgba(148,163,184,0.72))',
    fontSize: '0.9rem',
  },
};

const TaskTimeline = ({ traces = [] }) => {
  if (!traces || traces.length === 0) {
    return (
      <div style={styles.empty}>
        <FaClock size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <div>No execution trace available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.line} />
      {traces.map((trace, index) => {
        const stepType = trace.step_type || trace.event_type || '';
        const Icon = getStepIcon(stepType);
        const color = getStepColor(stepType);
        const details = formatDetails(trace.details);
        const durationStr = formatDurationMs(trace.duration_ms);
        const activityName = trace.activity_name;

        return (
          <div key={index} style={{
            ...styles.step,
            ...(index === traces.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}),
          }}>
            <div style={styles.iconWrapper(color)}>
              <Icon size={12} color={color} />
            </div>
            <div style={styles.header}>
              <span style={styles.label}>{formatStepType(stepType)}</span>
              {activityName && activityName !== stepType && (
                <span style={styles.activityName}>{activityName}</span>
              )}
              {durationStr && (
                <Badge bg="secondary" style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  {durationStr}
                </Badge>
              )}
              <span style={styles.timestamp}>{formatTimestamp(trace.created_at || trace.timestamp)}</span>
            </div>
            {details && (
              <div style={styles.details}>{details}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskTimeline;
