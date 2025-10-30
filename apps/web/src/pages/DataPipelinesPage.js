import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { ArrowRepeat, PlusCircleFill, LightbulbFill, ClockFill, PlayCircleFill, BellFill } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import './DataPipelinesPage.css';

const DataPipelinesPage = () => {
  const useCases = [
    {
      icon: ClockFill,
      title: 'Scheduled Reports',
      description: 'Automatically generate and send reports daily, weekly, or monthly'
    },
    {
      icon: ArrowRepeat,
      title: 'Data Sync',
      description: 'Keep your data up-to-date by syncing between systems automatically'
    },
    {
      icon: BellFill,
      title: 'Smart Alerts',
      description: 'Get notified when important metrics cross specific thresholds'
    }
  ];

  return (
    <Layout>
      <div className="pipelines-page">
        <div className="page-header">
          <h1 className="page-title">
            <ArrowRepeat className="title-icon" />
            Automations
          </h1>
          <p className="page-subtitle">Set up automated workflows to save time on repetitive tasks</p>
        </div>

        {/* Empty State */}
        <Card className="empty-state-card">
          <Card.Body className="text-center">
            <div className="empty-icon-wrapper">
              <ArrowRepeat size={64} className="empty-icon" />
            </div>
            <h3 className="empty-title">No automations yet</h3>
            <p className="empty-description">
              Create your first automation to handle repetitive tasks<br />
              automatically and save hours of manual work.
            </p>

            <Button variant="primary" size="lg" className="create-button">
              <PlusCircleFill className="me-2" />
              Create Automation
            </Button>

            {/* Use Cases */}
            <div className="use-cases-section">
              <h4 className="use-cases-title">What can you automate?</h4>
              <Row className="g-3">
                {useCases.map((useCase, index) => (
                  <Col key={index} md={4}>
                    <div className="use-case-card">
                      <useCase.icon size={32} className="use-case-icon" />
                      <h5 className="use-case-title">{useCase.title}</h5>
                      <p className="use-case-description">{useCase.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            <div className="empty-help">
              <LightbulbFill className="help-icon" />
              <div className="help-content">
                <strong>How do automations work?</strong>
                <p>
                  Automations run your tasks on a schedule or when specific conditions are met.
                  Once set up, they work in the background - you just see the results.
                  Perfect for reports, data updates, and monitoring.
                </p>
              </div>
            </div>

            <div className="quick-start">
              <h5 className="quick-start-title">Quick Start Examples:</h5>
              <div className="examples-list">
                <div className="example-item">
                  <PlayCircleFill className="example-icon" />
                  <span>Send weekly sales report every Monday at 9 AM</span>
                </div>
                <div className="example-item">
                  <PlayCircleFill className="example-icon" />
                  <span>Update customer data from CRM every night at midnight</span>
                </div>
                <div className="example-item">
                  <PlayCircleFill className="example-icon" />
                  <span>Alert me when revenue exceeds daily target</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default DataPipelinesPage;
