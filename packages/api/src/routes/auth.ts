import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  // TODO: replace with real identity provider / DB check.
  const isValid = Boolean(email) && Boolean(password);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const secret = process.env.JWT_SECRET || 'change_me';
  const token = jwt.sign(
    { sub: email, roles: ['tenant_admin'] },
    secret,
    { expiresIn: '1h' }
  );

  return res.json({ token, expiresIn: 3600 });
});

