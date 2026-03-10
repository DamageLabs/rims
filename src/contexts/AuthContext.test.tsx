import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '../services/authService';

vi.mock('../services/authService');

const mockUser = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin' as const,
  signInCount: 5,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function TestComponent() {
  const { user, isAuthenticated, isAdmin, login, logout, register, updateProfile, deleteAccount } = useAuth();

  return (
    <div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="admin">{String(isAdmin)}</div>
      <div data-testid="email">{user?.email ?? 'none'}</div>
      <button onClick={() => login({ email: 'admin@example.com', password: 'changeme' })}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register({ email: 'new@test.com', password: 'pass', confirmPassword: 'pass' })}>Register</button>
      <button onClick={() => updateProfile({ email: 'updated@test.com' })}>Update</button>
      <button onClick={() => deleteAccount()}>Delete</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  it('starts unauthenticated when no stored user', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('restores user from session on mount', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('admin').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('admin@example.com');
  });

  it('login sets user on success', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: mockUser });
    render(<AuthProvider><TestComponent /></AuthProvider>);

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('admin@example.com');
  });

  it('login does not set user when result has no user', async () => {
    vi.mocked(authService.login).mockResolvedValue({ error: 'Invalid credentials' });
    render(<AuthProvider><TestComponent /></AuthProvider>);

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logout clears user', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('authenticated').textContent).toBe('true');

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(authService.logout).toHaveBeenCalled();
  });

  it('register calls authService.register', async () => {
    vi.mocked(authService.register).mockResolvedValue({ success: true });
    render(<AuthProvider><TestComponent /></AuthProvider>);

    await act(async () => {
      screen.getByText('Register').click();
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'pass',
      confirmPassword: 'pass',
    });
  });

  it('updateProfile updates user on success', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    const updatedUser = { ...mockUser, email: 'updated@test.com' };
    vi.mocked(authService.updateProfile).mockResolvedValue(updatedUser);

    render(<AuthProvider><TestComponent /></AuthProvider>);

    await act(async () => {
      screen.getByText('Update').click();
    });

    expect(screen.getByTestId('email').textContent).toBe('updated@test.com');
  });

  it('deleteAccount clears user on success', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.deleteAccount).mockResolvedValue(true);

    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('authenticated').textContent).toBe('true');

    await act(async () => {
      screen.getByText('Delete').click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('isAdmin is false for non-admin users', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue({ ...mockUser, role: 'user' });
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('admin').textContent).toBe('false');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
