import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { userQueries, rateLimitQueries } from '../db';
import { sendVerificationEmail } from '../services/emailService';

const router = Router();

// Token expiry duration (24 hours)
const TOKEN_EXPIRY_HOURS = 24;

function generateToken(): string {
  // Generate 8-character alphanumeric code (uppercase letters and numbers)
  // Excluded confusing chars: I, O, 0, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
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
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }

    // Find user by token (uppercase for case-insensitive matching)
    const user = userQueries.findByVerificationToken(token.toUpperCase());
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification code' });
      return;
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpiresAt) {
      const expiresAt = new Date(user.emailVerificationTokenExpiresAt);
      if (expiresAt < new Date()) {
        res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
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
