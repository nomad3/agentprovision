import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userData?: { userId: string; tenantId: string; role: string };
}

export default (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Auth failed' });
  }
  try {
    const token = header.slice('Bearer '.length);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.userData = decodedToken as { userId: string; tenantId: string; role: string };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed' });
  }
};
