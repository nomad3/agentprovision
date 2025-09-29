import React from 'react';
import Layout from '../components/Layout';
import { Typography } from '@mui/material';

const TenantsPage: React.FC = () => {
  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Tenants
      </Typography>
      <Typography variant="body1">Manage tenants here.</Typography>
    </Layout>
  );
};

export default TenantsPage;

