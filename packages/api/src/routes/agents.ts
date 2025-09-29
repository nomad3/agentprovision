import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

export const agentsRouter = Router();

type Agent = {
  id: string;
  tenantId: string;
  name: string;
  type: 'dev' | 'devops' | 'qa' | 'data' | 'bi' | 'security' | 'docs';
  version: string;
  status: 'draft' | 'deployed' | 'paused' | 'retired';
  createdAt: string;
};

const agents = new Map<string, Agent>();

const CreateAgentSchema = z.object({
  id: z.string().min(3),
  tenantId: z.string().min(3),
  name: z.string().min(3),
  type: z.enum(['dev', 'devops', 'qa', 'data', 'bi', 'security', 'docs']),
  version: z.string().default('v1')
});

agentsRouter.use(requireAuth);

agentsRouter.get('/', (req, res) => {
  const { tenantId } = req.query as { tenantId?: string };
  const list = Array.from(agents.values()).filter((a) => !tenantId || a.tenantId === tenantId);
  return res.json({ items: list });
});

agentsRouter.post('/', (req, res) => {
  const parsed = CreateAgentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const { id } = parsed.data;
  if (agents.has(id)) return res.status(409).json({ error: 'Agent exists' });
  const a: Agent = {
    ...parsed.data,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  agents.set(id, a);
  return res.status(201).json(a);
});

agentsRouter.post('/:id/deploy', (req, res) => {
  const a = agents.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.status = 'deployed';
  agents.set(a.id, a);
  return res.json({ id: a.id, status: a.status });
});

agentsRouter.post('/:id/pause', (req, res) => {
  const a = agents.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.status = 'paused';
  agents.set(a.id, a);
  return res.json({ id: a.id, status: a.status });
});

agentsRouter.post('/:id/retire', (req, res) => {
  const a = agents.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.status = 'retired';
  agents.set(a.id, a);
  return res.json({ id: a.id, status: a.status });
});

