import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUsers, getUserById, updateUserRole, deleteUser } from './userService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'user' as const,
  signInCount: 5,
  lastSignInAt: '2024-01-01T00:00:00Z',
  lastSignInIp: '127.0.0.1',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('returns all users from API', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'admin@example.com', role: 'admin' as const }];
      vi.mocked(api.get).mockResolvedValue(users);

      const result = await getAllUsers();

      expect(api.get).toHaveBeenCalledWith('/users');
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('test@example.com');
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockUser);

      const result = await getUserById(1);

      expect(result?.email).toBe('test@example.com');
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateUserRole', () => {
    it('updates role via API', async () => {
      const updatedUser = { ...mockUser, role: 'admin' as const };
      vi.mocked(api.put).mockResolvedValue(updatedUser);

      const result = await updateUserRole(1, 'admin');

      expect(api.put).toHaveBeenCalledWith('/users/1/role', { role: 'admin' });
      expect(result?.role).toBe('admin');
    });
  });

  describe('deleteUser', () => {
    it('deletes user via API', async () => {
      vi.mocked(api.delete).mockResolvedValue({ message: 'User deleted' });

      const result = await deleteUser(1);

      expect(api.delete).toHaveBeenCalledWith('/users/1');
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));

      const result = await deleteUser(999);

      expect(result).toBe(false);
    });
  });
});
