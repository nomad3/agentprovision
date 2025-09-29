import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

export const tenantsRouter = Router();

type Tenant = {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  region: string;
  createdAt: string;
};

const tenants = new Map<string, Tenant>();

const CreateTenantSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  plan: z.enum(['free', 'pro', 'enterprise']).default('pro'),
  region: z.string().default('us-east-1')
});

tenantsRouter.use(requireAuth);

tenantsRouter.get('/', (_req, res) => {
  return res.json({ items: Array.from(tenants.values()) });
});

tenantsRouter.post('/', (req, res) => {
  const parsed = CreateTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { id, name, plan, region } = parsed.data;
  if (tenants.has(id)) return res.status(409).json({ error: 'Tenant exists' });
  const t: Tenant = { id, name, plan, region, createdAt: new Date().toISOString() };
  tenants.set(id, t);
  return res.status(201).json(t);
});

tenantsRouter.get('/:id', (req, res) => {
  const t = tenants.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  return res.json(t);
});

tenantsRouter.patch('/:id', (req, res) => {
  const t = tenants.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const UpdateSchema = CreateTenantSchema.partial().omit({ id: true });
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const updated: Tenant = { ...t, ...parsed.data };
  tenants.set(updated.id, updated);
  return res.json(updated);
});

tenantsRouter.delete('/:id', (req, res) => {
  tenants.delete(req.params.id);
  return res.status(204).send();
});

