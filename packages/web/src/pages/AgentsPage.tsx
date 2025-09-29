import React from 'react';
import Layout from '../components/Layout';
import { Typography } from '@mui/material';

const AgentsPage: React.FC = () => {
  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Agents
      </Typography>
      <Typography variant="body1">Configure and monitor agents here.</Typography>
    </Layout>
  );
};

export default AgentsPage;

