import React from 'react';
import { Row, Col, Card, Badge, Table, ProgressBar, ListGroup } from 'react-bootstrap';
import { FaChartPie, FaBolt, FaShieldAlt, FaArrowTrendUp, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Layout from '../components/Layout';
import { useAuth } from '../App';

const summaryTiles = [
  {
    title: 'Executive dashboards live',
    value: '128',
    delta: '+12 vs last week',
    deltaVariant: 'success',
    badge: 'Revenue intelligence',
    badgeVariant: 'primary',
    icon: FaChartPie,
  },
  {
    title: 'Signals processed per minute',
    value: '2.4M',
    delta: '-3% vs target',
    deltaVariant: 'danger',
    badge: 'Data mesh',
    badgeVariant: 'info',
    icon: FaBolt,
  },
  {
    title: 'Governed data products',
    value: '86',
    delta: '+8 this quarter',
    deltaVariant: 'success',
    badge: 'Compliance',
    badgeVariant: 'warning',
    icon: FaShieldAlt,
  },
  {
    title: 'Closed-loop automations',
    value: '54',
    delta: '+6 new runbooks',
    deltaVariant: 'success',
    badge: 'Operations',
    badgeVariant: 'dark',
    icon: FaArrowTrendUp,
  },
];

const trendingInsights = [
  {
    title: 'Pipeline conversion up 18%',
    detail: 'Propensity models surfaced expansion-ready cohorts across enterprise SaaS accounts.',
    stat: '+18% QoQ',
    statVariant: 'success',
  },
  {
    title: 'APAC churn risk rising',
    detail: 'Customer health index dipped below 0.74 for 18 mid-market logos in the region.',
    stat: '+6% risk',
    statVariant: 'warning',
  },
  {
    title: 'Forecast variance tightened',
    detail: 'Scenario planning reduced revenue forecast gap to $1.2M for Q4 close.',
    stat: '-$3.1M gap',
    statVariant: 'info',
  },
];

const pipelineHealth = [
  {
    name: 'Usage telemetry → Snowflake',
    description: 'Event spine powering product engagement dashboards and retention scores.',
    completeness: 92,
    variant: 'success',
  },
  {
    name: 'Revenue to CRM sync',
    description: 'Streaming ARR updates refreshing GTM opportunity models every 5 minutes.',
    completeness: 81,
    variant: 'info',
  },
  {
    name: 'Financial close automation',
    description: 'GL reconciliations publishing variance KPIs to finance workspace nightly.',
    completeness: 64,
    variant: 'warning',
  },
];

const segmentPerformance = [
  {
    segment: 'Enterprise SaaS',
    arrGrowth: '+14%',
    arpu: '$24.8K',
    velocity: '12.4 days',
    conversion: '19%',
    trendVariant: 'success',
  },
  {
    segment: 'Mid-market APAC',
    arrGrowth: '-6%',
    arpu: '$8.9K',
    velocity: '18.6 days',
    conversion: '11%',
    trendVariant: 'danger',
  },
  {
    segment: 'Healthcare',
    arrGrowth: '+9%',
    arpu: '$17.2K',
    velocity: '10.2 days',
    conversion: '15%',
    trendVariant: 'success',
  },
  {
    segment: 'FinServ strategic',
    arrGrowth: '+4%',
    arpu: '$32.4K',
    velocity: '9.7 days',
    conversion: '21%',
    trendVariant: 'info',
  },
];

const alerts = [
  {
    title: 'Churn spike flagged in APAC mid-market',
    detail: 'Cancellation probability climbed to 0.68 for five key accounts — activate retention playbook.',
    variant: 'warning',
    icon: FaExclamationTriangle,
  },
  {
    title: 'Compliance checks cleared for EU residency',
    detail: 'All 24 governed datasets renewed residency attestations for the Q4 audit cycle.',
    variant: 'success',
    icon: FaCheckCircle,
  },
  {
    title: 'Scenario C requires executive review',
    detail: 'Forecast projects $2.1M shortfall if capacity hiring slips by four weeks.',
    variant: 'danger',
    icon: FaExclamationTriangle,
  },
];

const nextActions = [
  {
    title: 'Publish Q4 revenue forecast deck',
    owner: 'Finance Ops · Owner: Priya K.',
    due: 'Due today',
  },
  {
    title: 'Run churn mitigation workshop for APAC',
    owner: 'Customer Success · Owner: Diego R.',
    due: 'Due in 2 days',
  },
  {
    title: 'Approve governance rules for new data product',
    owner: 'Data Governance · Owner: Mei L.',
    due: 'Due Friday',
  },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const viewerEmail = user?.email ?? 'demo@agentprovision.ai';

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h2 className="mb-1">Analytics Command Center</h2>
          <p className="text-muted mb-0">
            Simulated intelligence blend compiled from product usage, revenue, and operations telemetry.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark">{viewerEmail}</Badge>
          <Badge bg="info" text="dark">
            Demo data set
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        {summaryTiles.map(({ title, value, delta, deltaVariant, badge, badgeVariant, icon: Icon }) => (
          <Col md={3} key={title}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="icon-pill-sm">
                    <Icon size={20} />
                  </div>
                  <Badge bg={badgeVariant}>{badge}</Badge>
                </div>
                <h6 className="text-muted mb-1">{title}</h6>
                <div className="display-6 fw-bold">{value}</div>
                <div className={`mt-2 small text-${deltaVariant}`}>{delta}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Trending intelligence narratives</span>
              <Badge bg="secondary">Narratives</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              <ListGroup variant="flush">
                {trendingInsights.map(({ title, detail, stat, statVariant }) => (
                  <ListGroup.Item key={title} className="bg-transparent px-0 py-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{title}</h6>
                        <p className="text-muted mb-0 small">{detail}</p>
                      </div>
                      <Badge bg={statVariant}>{stat}</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Pipeline health & freshness</span>
              <Badge bg="secondary">Data mesh</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              {pipelineHealth.map(({ name, description, completeness, variant }) => (
                <div key={name} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">{name}</span>
                    <span className="text-muted small">{completeness}% quality</span>
                  </div>
                  <p className="text-muted small mb-2">{description}</p>
                  <ProgressBar now={completeness} variant={variant} />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Segment performance snapshot</span>
              <Badge bg="secondary">Business intelligence</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              <Table hover responsive borderless className="mb-0 align-middle">
                <thead className="text-muted">
                  <tr>
                    <th>Segment</th>
                    <th>ARR growth</th>
                    <th>ARPU</th>
                    <th>Pipeline velocity</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentPerformance.map(({ segment, arrGrowth, arpu, velocity, conversion, trendVariant }) => (
                    <tr key={segment}>
                      <td className="fw-semibold">{segment}</td>
                      <td>
                        <Badge bg={trendVariant}>{arrGrowth}</Badge>
                      </td>
                      <td>{arpu}</td>
                      <td>{velocity}</td>
                      <td>{conversion}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Alerts & watchlist</span>
              <Badge bg="secondary">Risk</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              <ListGroup variant="flush">
                {alerts.map(({ title, detail, variant, icon: Icon }) => (
                  <ListGroup.Item key={title} className="bg-transparent px-0 py-3">
                    <div className="d-flex align-items-start">
                      <span className={`me-3 mt-1 text-${variant}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <h6 className="mb-1">{title}</h6>
                        <p className="text-muted small mb-0">{detail}</p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Next best actions</span>
              <Badge bg="secondary">Execution</Badge>
            </Card.Header>
            <Card.Body className="pt-0">
              <ListGroup variant="flush">
                {nextActions.map(({ title, owner, due }) => (
                  <ListGroup.Item key={title} className="bg-transparent px-0 py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="mb-1">{title}</h6>
                        <p className="text-muted small mb-0">{owner}</p>
                      </div>
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <FaClock /> {due}
                      </span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default DashboardPage;
