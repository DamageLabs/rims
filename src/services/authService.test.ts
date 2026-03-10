import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout, getCurrentUser } from './authService';
import { STORAGE_KEYS, getFromStorage, removeFromStorage } from './storage';

vi.mock('./storage', () => ({
  STORAGE_KEYS: {
    CURRENT_USER: 'rims_current_user',
  },
  saveToStorage: vi.fn(),
  getFromStorage: vi.fn(),
  removeFromStorage: vi.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logout', () => {
    it('removes current user from storage', () => {
      logout();

      expect(removeFromStorage).toHaveBeenCalledWith(STORAGE_KEYS.CURRENT_USER);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user from storage', () => {
      const storedUser = { id: 1, email: 'test@example.com', role: 'user' };
      vi.mocked(getFromStorage).mockReturnValue(storedUser);

      const result = getCurrentUser();

      expect(getFromStorage).toHaveBeenCalledWith(STORAGE_KEYS.CURRENT_USER);
      expect(result).toEqual(storedUser);
    });

    it('returns null when no user in storage', () => {
      vi.mocked(getFromStorage).mockReturnValue(null);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
