import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaChartBar,
  FaComments,
  FaFileAlt,
  FaRocket,
  FaLightbulb,
  FaHistory
} from 'react-icons/fa';
import Layout from '../components/Layout';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: FaFileAlt,
      title: 'Analyze Data',
      description: 'Upload a file or connect a data source',
      action: () => navigate('/datasets'),
      color: 'primary'
    },
    {
      icon: FaComments,
      title: 'Ask AI',
      description: 'Get instant answers to your questions',
      action: () => navigate('/chat'),
      color: 'success'
    },
    {
      icon: FaChartBar,
      title: 'View Dashboard',
      description: 'See your key metrics and insights',
      action: () => navigate('/dashboard'),
      color: 'info'
    }
  ];

  const recentActivity = [
    { label: 'Sales Data Q4', status: 'Ready to analyze', time: '2 hours ago', type: 'dataset' },
    { label: 'Customer Analysis', status: 'Completed', time: 'Yesterday', type: 'report' },
    { label: 'Monthly KPIs', status: 'Auto-updated', time: '3 days ago', type: 'dashboard' }
  ];

  return (
    <Layout>
      <div className="home-page">
        {/* Welcome Header */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back! <span className="wave">👋</span>
            </h1>
            <p className="welcome-subtitle">
              What would you like to do today?
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2 className="section-title">
            <FaRocket className="section-icon" />
            Quick Actions
          </h2>
          <Row className="g-4">
            {quickActions.map((action, index) => (
              <Col key={index} md={4}>
                <Card className={`quick-action-card action-${action.color}`} onClick={action.action}>
                  <Card.Body>
                    <div className="action-icon-wrapper">
                      <action.icon size={32} className="action-icon" />
                    </div>
                    <h3 className="action-title">{action.title}</h3>
                    <p className="action-description">{action.description}</p>
                    <Button variant={action.color} size="sm" className="action-button">
                      Get Started →
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2 className="section-title">
            <FaHistory className="section-icon" />
            Recent Activity
          </h2>
          <Card className="activity-card">
            <Card.Body>
              {recentActivity.length > 0 ? (
                <div className="activity-list">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-indicator"></div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-label">{item.label}</span>
                          <span className="activity-time">{item.time}</span>
                        </div>
                        <span className="activity-status">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-activity">
                  <FaLightbulb size={48} className="empty-icon" />
                  <p className="empty-text">
                    No activity yet. Start by analyzing data or asking AI a question!
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Getting Started Tips */}
        <div className="tips-section">
          <Card className="tips-card">
            <Card.Body>
              <h3 className="tips-title">
                <FaLightbulb className="tips-icon" />
                Getting Started Tips
              </h3>
              <ul className="tips-list">
                <li>Upload your first dataset to get AI-powered insights</li>
                <li>Ask AI questions in plain English - no technical knowledge needed</li>
                <li>Create dashboards to monitor your key metrics automatically</li>
                <li>Set up automations to save time on repetitive tasks</li>
              </ul>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
