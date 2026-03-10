import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { userQueries, rateLimitQueries, getDatabase } from '../db';
import { sendVerificationEmail } from '../services/emailService';

const router = Router();

// Token expiry duration (24 hours)
const TOKEN_EXPIRY_HOURS = 24;

function generateToken(): string {
  return crypto.randomUUID();
}

function getTokenExpiryDate(): string {
  const date = new Date();
  date.setHours(date.getHours() + TOKEN_EXPIRY_HOURS);
  return date.toISOString();
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, passwordConfirmation } = req.body;

    // Validate input
    if (!email || !password || !passwordConfirmation) {
      res.status(400).json({ error: 'Email, password, and password confirmation are required' });
      return;
    }

    if (password !== passwordConfirmation) {
      res.status(400).json({ error: 'Password confirmation does not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if email already exists
    const existingUser = userQueries.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email has already been taken' });
      return;
    }

    // Generate verification token
    const verificationToken = generateToken();
    const tokenExpiresAt = getTokenExpiryDate();

    // Create user
    const user = userQueries.create({
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      rateLimitQueries.recordEmailSent(email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can resend
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    // Find user by token
    const user = userQueries.findByVerificationToken(token);
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpiresAt) {
      const expiresAt = new Date(user.emailVerificationTokenExpiresAt);
      if (expiresAt < new Date()) {
        res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        return;
      }
    }

    // Mark email as verified
    const verifiedUser = userQueries.markEmailVerified(user.id);

    // Return user data so frontend can sync
    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: verifiedUser ? {
        email: verifiedUser.email,
        password: verifiedUser.password,
        role: verifiedUser.role,
      } : null
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find user by email
    const user = userQueries.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: 'If an account with that email exists, a verification email has been sent.' });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.status(400).json({ error: 'Email is already verified' });
      return;
    }

    // Check rate limit
    if (!rateLimitQueries.canSendEmail(email)) {
      res.status(429).json({ error: 'Please wait at least 1 minute before requesting another verification email' });
      return;
    }

    // Generate new token
    const verificationToken = generateToken();
    const tokenExpiresAt = getTokenExpiryDate();

    userQueries.setVerificationToken(user.id, verificationToken, tokenExpiresAt);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      rateLimitQueries.recordEmailSent(email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email' });
      return;
    }

    res.json({ message: 'If an account with that email exists, a verification email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// POST /api/auth/check-verification
router.post('/check-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = userQueries.findByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ emailVerified: user.emailVerified });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

// POST /api/auth/login
router.post('/login', (_req: Request, res: Response) => {
  try {
    const { email, password } = _req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = userQueries.findByEmail(email);
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'email_not_verified' });
      return;
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE users SET sign_in_count = sign_in_count + 1, last_sign_in_at = ?, last_sign_in_ip = ?, updated_at = ? WHERE id = ?'
    ).run(now, '127.0.0.1', now, user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        signInCount: user.signInCount + 1,
        lastSignInAt: now,
        lastSignInIp: '127.0.0.1',
        emailVerified: true,
        createdAt: user.createdAt,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PUT /api/auth/profile/:id
router.put('/profile/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { email, password, currentPassword } = req.body;

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (currentPassword && currentPassword !== row.password) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const now = new Date().toISOString();

    if (email && email.toLowerCase() !== (row.email as string).toLowerCase()) {
      const emailTaken = userQueries.findByEmail(email);
      if (emailTaken && emailTaken.id !== id) {
        res.status(400).json({ error: 'Email has already been taken' });
        return;
      }
      db.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?').run(email, now, id);
    }

    if (password) {
      db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(password, now, id);
    }

    const updatedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({
      user: {
        id: updatedRow.id,
        email: updatedRow.email,
        role: updatedRow.role,
        signInCount: updatedRow.sign_in_count,
        lastSignInAt: updatedRow.last_sign_in_at,
        lastSignInIp: updatedRow.last_sign_in_ip,
        emailVerified: updatedRow.email_verified === 1,
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// DELETE /api/auth/profile/:id
router.delete('/profile/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = getDatabase();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /api/auth/sync - Sync user from server to frontend (validates password)
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = userQueries.findByEmail(email);
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }

    res.json({
      user: {
        email: user.email,
        password: user.password,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
