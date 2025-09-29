import React from 'react';
import Layout from '../components/Layout';
import { Typography } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">Welcome to AgentProvision.</Typography>
    </Layout>
  );
};

export default DashboardPage;

