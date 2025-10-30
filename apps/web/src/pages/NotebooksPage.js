import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { JournalBookmarkFill, PlusCircleFill, LightbulbFill } from 'react-bootstrap-icons';
import Layout from '../components/Layout';
import './NotebooksPage.css';

const NotebooksPage = () => {
  return (
    <Layout>
      <div className="notebooks-page">
        <div className="page-header">
          <h1 className="page-title">
            <JournalBookmarkFill className="title-icon" />
            Analysis Workbooks
          </h1>
          <p className="page-subtitle">Create interactive workbooks to explore and analyze your data</p>
        </div>

        {/* Empty State */}
        <Card className="empty-state-card">
          <Card.Body className="text-center">
            <div className="empty-icon-wrapper">
              <JournalBookmarkFill size={64} className="empty-icon" />
            </div>
            <h3 className="empty-title">No workbooks yet</h3>
            <p className="empty-description">
              Create your first analysis workbook to explore data,<br />
              run queries, and generate insights with AI assistance.
            </p>

            <Button variant="primary" size="lg" className="create-button">
              <PlusCircleFill className="me-2" />
              Create Workbook
            </Button>

            <div className="empty-help">
              <LightbulbFill className="help-icon" />
              <div className="help-content">
                <strong>What are Analysis Workbooks?</strong>
                <p>
                  Think of them as interactive notebooks where you can write queries,
                  visualize data, and document your analysis - all in one place.
                  Perfect for data exploration and creating reports.
                </p>
              </div>
            </div>

            <div className="features-list">
              <div className="feature-item">✓ Write SQL and Python code</div>
              <div className="feature-item">✓ Create visualizations</div>
              <div className="feature-item">✓ Share with your team</div>
              <div className="feature-item">✓ AI-powered suggestions</div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default NotebooksPage;
