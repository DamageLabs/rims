import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllCategories,
  getCategoriesByType,
  getCategoryNamesByType,
  getCategoryNames,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategoryItemCounts,
} from './categoryService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCategory = {
  id: 1,
  name: 'Resistors',
  sortOrder: 0,
  inventoryTypeId: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('returns all categories from API', async () => {
      vi.mocked(api.get).mockResolvedValue([mockCategory]);
      const result = await getAllCategories();
      expect(api.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('getCategoriesByType', () => {
    it('fetches categories filtered by type ID', async () => {
      vi.mocked(api.get).mockResolvedValue([mockCategory]);
      const result = await getCategoriesByType(1);
      expect(api.get).toHaveBeenCalledWith('/categories?typeId=1');
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('getCategoryNamesByType', () => {
    it('returns array of category names for a type', async () => {
      vi.mocked(api.get).mockResolvedValue([mockCategory, { ...mockCategory, id: 2, name: 'Capacitors' }]);
      const result = await getCategoryNamesByType(1);
      expect(result).toEqual(['Resistors', 'Capacitors']);
    });
  });

  describe('getCategoryNames', () => {
    it('returns all category names', async () => {
      vi.mocked(api.get).mockResolvedValue([mockCategory]);
      const result = await getCategoryNames();
      expect(result).toEqual(['Resistors']);
    });
  });

  describe('getCategoryById', () => {
    it('returns category when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockCategory);
      const result = await getCategoryById(1);
      expect(api.get).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockCategory);
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      const result = await getCategoryById(999);
      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('creates category via API', async () => {
      const formData = { name: 'LEDs', sortOrder: 1, inventoryTypeId: 1 };
      vi.mocked(api.post).mockResolvedValue({ ...mockCategory, ...formData, id: 2 });
      const result = await createCategory(formData);
      expect(api.post).toHaveBeenCalledWith('/categories', formData);
      expect(result.name).toBe('LEDs');
    });
  });

  describe('updateCategory', () => {
    it('updates category via API', async () => {
      vi.mocked(api.put).mockResolvedValue({ ...mockCategory, name: 'Updated' });
      const result = await updateCategory(1, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/categories/1', { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Not found'));
      const result = await updateCategory(999, { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('returns true on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({});
      const result = await deleteCategory(1);
      expect(api.delete).toHaveBeenCalledWith('/categories/1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));
      const result = await deleteCategory(999);
      expect(result).toBe(false);
    });
  });

  describe('reorderCategories', () => {
    it('sends ordered IDs via PUT', async () => {
      vi.mocked(api.put).mockResolvedValue(undefined);
      await reorderCategories([3, 1, 2]);
      expect(api.put).toHaveBeenCalledWith('/categories/reorder', { orderedIds: [3, 1, 2] });
    });
  });

  describe('getCategoryItemCounts', () => {
    it('returns category counts from API', async () => {
      const counts = [{ name: 'Resistors', count: 10 }];
      vi.mocked(api.get).mockResolvedValue(counts);
      const result = await getCategoryItemCounts();
      expect(api.get).toHaveBeenCalledWith('/categories/counts');
      expect(result).toEqual(counts);
    });
  });
});
