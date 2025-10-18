# Gemini Platform

Gemini is a unified data and AI platform that brings together all your data, analytics, and AI workloads.

## Features

*   **Collaborative Notebooks:** Work together in real-time on notebooks for data exploration, analysis, and model building.
*   **Unified Data & AI:** A single platform for data engineering, data science, machine learning, and business intelligence.
*   **Data Engineering & ETL:** Build and manage reliable data pipelines to ingest, transform, and process data from any source.
*   **Machine Learning & Data Science:** An end-to-end platform for the entire machine learning lifecycle, from experimentation to production.
*   **SQL Analytics & BI:** Run SQL queries on your data lake and build interactive dashboards to visualize your data.

# AgentProvision

AgentProvision is an enterprise-grade platform for orchestrating AI agents across multi-cloud environments. The monorepo contains a Next.js experience for the marketing site and operator console, a FastAPI backend with seeded demo tenants, and IaC assets for provisioning infrastructure.

## Highlights

- **Multi-tenant control plane**: Manage isolated tenants, agents, deployments, and users with JWT-secured APIs.
- **Enterprise-ready authentication**: Password hashing, token issuance, and demo seed data (`retail-demo@agentprovision.com` / `SecurePass!23`) for instant evaluation.
- **Interactive console**: Protected dashboard at `/dashboard` featuring live analytics, fleet overview, deployment status, and workspace settings.
- **Composable marketing site**: Landing experience at `/` describing compliance, integrations, and workflow story for AgentProvision.
- **Infrastructure foundations**: Docker-compose for local development plus Terraform scaffolding targeting AWS (EKS, Aurora, S3).