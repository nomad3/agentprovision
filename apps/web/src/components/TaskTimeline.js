import { Badge } from 'react-bootstrap';
import {
  FaBrain,
  FaCheck,
  FaClock,
  FaCog,
  FaRobot,
  FaTimes
} from 'react-icons/fa';

const STEP_ICONS = {
  agent: FaRobot,
  thinking: FaBrain,
  processing: FaCog,
  success: FaCheck,
  failure: FaTimes,
  waiting: FaClock,
};

const getStepIcon = (stepType) => {
  const normalized = (stepType || '').toLowerCase();
  for (const [key, Icon] of Object.entries(STEP_ICONS)) {
    if (normalized.includes(key)) return Icon;
  }
  return FaCog;
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
  iconWrapper: {
    position: 'absolute',
    left: '-2rem',
    top: '0.15rem',
    width: '1.8rem',
    height: '1.8rem',
    borderRadius: '50%',
    background: 'var(--surface-contrast, #2d333b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--color-border, rgba(255,255,255,0.1))',
    zIndex: 1,
  },
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
        const Icon = getStepIcon(trace.step_type);
        const details = formatDetails(trace.details);

        return (
          <div key={index} style={{
            ...styles.step,
            ...(index === traces.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}),
          }}>
            <div style={styles.iconWrapper}>
              <Icon size={12} color="var(--color-soft, rgba(226,232,240,0.9))" />
            </div>
            <div style={styles.header}>
              <span style={styles.label}>{formatStepType(trace.step_type)}</span>
              {(trace.duration_ms || trace.duration) && (
                <Badge bg="secondary" style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  {trace.duration_ms ? `${trace.duration_ms}ms` : trace.duration}
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
