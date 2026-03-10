import { UserWithoutPassword, LoginCredentials, RegisterData } from '../types/User';
import { STORAGE_KEYS, getFromStorage, saveToStorage, removeFromStorage } from './storage';

export interface LoginResult {
  user: UserWithoutPassword | null;
  error?: 'invalid_credentials' | 'email_not_verified';
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok) {
    if (result.error === 'email_not_verified') {
      return { user: null, error: 'email_not_verified' };
    }
    return { user: null, error: 'invalid_credentials' };
  }

  const user = result.user as UserWithoutPassword;
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  return { user };
}

export function isEmailVerified(_email: string): boolean {
  // This is now handled server-side during login
  return true;
}

export function logout(): void {
  removeFromStorage(STORAGE_KEYS.CURRENT_USER);
}

export function getCurrentUser(): UserWithoutPassword | null {
  return getFromStorage<UserWithoutPassword>(STORAGE_KEYS.CURRENT_USER);
}

export interface RegisterResult {
  success: boolean;
  message: string;
  userId?: number;
}

export async function register(data: RegisterData): Promise<RegisterResult> {
  if (data.password !== data.passwordConfirmation) {
    throw new Error('Password confirmation does not match');
  }

  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Registration failed');
  }

  return {
    success: true,
    message: result.message,
    userId: result.userId,
  };
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to resend verification email');
  }

  return { success: true, message: result.message };
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Email verification failed');
  }

  return { success: true, message: result.message };
}

export async function updateProfile(
  userId: number,
  data: { email?: string; password?: string; currentPassword?: string }
): Promise<UserWithoutPassword | null> {
  const response = await fetch(`/api/auth/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Profile update failed');
  }

  const user = result.user as UserWithoutPassword;
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export async function deleteAccount(userId: number): Promise<boolean> {
  const response = await fetch(`/api/auth/profile/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    return false;
  }

  removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  return true;
}
