import React, { useEffect, useState } from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  CloudUploadFill,
  Robot,
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
            icon={Robot}
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
