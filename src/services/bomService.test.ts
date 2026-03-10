import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  calculateBOMCost,
  checkAvailability,
  duplicateBOM,
} from './bomService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockBOM = {
  id: 1,
  name: 'AR-15 Build',
  description: 'Complete AR-15 build',
  items: [{ itemId: 1, quantity: 1 }],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('bomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBOMs', () => {
    it('returns all BOMs from API', async () => {
      vi.mocked(api.get).mockResolvedValue([mockBOM]);
      const result = await getAllBOMs();
      expect(api.get).toHaveBeenCalledWith('/boms');
      expect(result).toEqual([mockBOM]);
    });
  });

  describe('getBOMById', () => {
    it('returns BOM when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockBOM);
      const result = await getBOMById(1);
      expect(api.get).toHaveBeenCalledWith('/boms/1');
      expect(result).toEqual(mockBOM);
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      const result = await getBOMById(999);
      expect(result).toBeNull();
    });
  });

  describe('createBOM', () => {
    it('creates BOM via API', async () => {
      const formData = { name: 'New BOM', description: 'Desc', items: [] };
      vi.mocked(api.post).mockResolvedValue({ ...mockBOM, ...formData, id: 2 });
      const result = await createBOM(formData);
      expect(api.post).toHaveBeenCalledWith('/boms', formData);
      expect(result.name).toBe('New BOM');
    });
  });

  describe('updateBOM', () => {
    it('updates BOM via API', async () => {
      vi.mocked(api.put).mockResolvedValue({ ...mockBOM, name: 'Updated' });
      const result = await updateBOM(1, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/boms/1', { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Not found'));
      const result = await updateBOM(999, { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteBOM', () => {
    it('returns true on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({});
      const result = await deleteBOM(1);
      expect(api.delete).toHaveBeenCalledWith('/boms/1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));
      const result = await deleteBOM(999);
      expect(result).toBe(false);
    });
  });

  describe('calculateBOMCost', () => {
    it('returns cost breakdown', async () => {
      const breakdown = {
        totalCost: 100,
        itemCosts: [{ itemId: 1, itemName: 'Part', quantity: 1, unitCost: 100, totalCost: 100, available: 5, canBuild: true }],
      };
      vi.mocked(api.get).mockResolvedValue(breakdown);
      const result = await calculateBOMCost(1);
      expect(api.get).toHaveBeenCalledWith('/boms/1/cost');
      expect(result?.totalCost).toBe(100);
    });

    it('returns null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('fail'));
      const result = await calculateBOMCost(999);
      expect(result).toBeNull();
    });
  });

  describe('checkAvailability', () => {
    it('returns canBuild true when all items available', async () => {
      vi.mocked(api.get).mockResolvedValue({
        totalCost: 100,
        itemCosts: [{ itemId: 1, itemName: 'Part', quantity: 1, unitCost: 50, totalCost: 50, available: 5, canBuild: true }],
      });
      const result = await checkAvailability(1);
      expect(result.canBuild).toBe(true);
      expect(result.missingItems).toHaveLength(0);
    });

    it('returns missing items when not available', async () => {
      vi.mocked(api.get).mockResolvedValue({
        totalCost: 100,
        itemCosts: [{ itemId: 1, itemName: 'Bolt', quantity: 3, unitCost: 10, totalCost: 30, available: 1, canBuild: false }],
      });
      const result = await checkAvailability(1);
      expect(result.canBuild).toBe(false);
      expect(result.missingItems).toContain('Bolt (need 3, have 1)');
    });

    it('returns canBuild false when cost calculation fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('fail'));
      const result = await checkAvailability(999);
      expect(result.canBuild).toBe(false);
      expect(result.missingItems).toHaveLength(0);
    });
  });

  describe('duplicateBOM', () => {
    it('duplicates BOM via API', async () => {
      vi.mocked(api.post).mockResolvedValue({ ...mockBOM, id: 2, name: 'Copy' });
      const result = await duplicateBOM(1, 'Copy');
      expect(api.post).toHaveBeenCalledWith('/boms/1/duplicate', { name: 'Copy' });
      expect(result?.name).toBe('Copy');
    });

    it('returns null on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('fail'));
      const result = await duplicateBOM(999, 'Copy');
      expect(result).toBeNull();
    });
  });
});
