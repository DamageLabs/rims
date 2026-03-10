import { Router, Request, Response } from 'express';
import { queryAll, queryOne, update, deleteById } from '../db/index';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password: string;
  role: string;
  signInCount: number;
  lastSignInAt: string | null;
  lastSignInIp: string | null;
  createdAt: string;
  updatedAt: string;
}

function stripPassword(user: UserRow): Omit<UserRow, 'password'> {
  const { password, ...rest } = user;
  return rest;
}

// GET / — list all users (without passwords)
router.get('/', (_req: Request, res: Response) => {
  try {
    const users = queryAll<UserRow>('SELECT * FROM users');
    res.json(users.map(stripPassword));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /:id — get one user (without password)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(stripPassword(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /:id/role — update user role
router.put('/:id/role', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    const user = update<UserRow>('users', id, { role, updatedAt: new Date().toISOString() });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(stripPassword(user));
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// DELETE /:id — delete user
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteById('users', id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
