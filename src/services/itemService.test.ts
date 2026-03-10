import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  deleteItems,
  updateItemsCategory,
  getLowStockItems,
  getItemsNeedingReorder,
  getItemStats,
} from './itemService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockItem = {
  id: 1,
  name: 'Test Item',
  description: 'A test item',
  quantity: 10,
  unitValue: 5.99,
  value: 59.9,
  picture: null,
  category: 'Electronics',
  location: 'Shelf A1',
  barcode: '123456789',
  reorderPoint: 5,
  inventoryTypeId: 1,
  customFields: { modelNumber: 'TM-001', partNumber: 'VP-001', vendorName: 'Test Vendor' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('itemService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllItems', () => {
    it('returns all items from API', async () => {
      const items = [mockItem, { ...mockItem, id: 2, name: 'Item 2' }];
      vi.mocked(api.get).mockResolvedValue(items);

      const result = await getAllItems();

      expect(api.get).toHaveBeenCalledWith('/items');
      expect(result).toEqual(items);
    });
  });

  describe('getItemById', () => {
    it('returns item when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockItem);

      const result = await getItemById(1);

      expect(api.get).toHaveBeenCalledWith('/items/1');
      expect(result).toEqual(mockItem);
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getItemById(999);

      expect(result).toBeNull();
    });
  });

  describe('createItem', () => {
    it('creates item via API', async () => {
      const formData = {
        name: 'New Item',
        description: 'Description',
        quantity: 5,
        unitValue: 10.0,
        picture: null,
        category: 'Hardware',
        location: 'Shelf B1',
        barcode: '',
        reorderPoint: 0,
        inventoryTypeId: 1,
        customFields: { modelNumber: 'TM-002', vendorName: 'Vendor' },
      };
      vi.mocked(api.post).mockResolvedValue({ ...mockItem, ...formData, id: 2, value: 50.0 });

      const result = await createItem(formData);

      expect(api.post).toHaveBeenCalledWith('/items', formData);
      expect(result.name).toBe('New Item');
    });
  });

  describe('updateItem', () => {
    it('returns null when item not found', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Not found'));

      const result = await updateItem(999, { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('updates item via API', async () => {
      const updatedItem = { ...mockItem, name: 'Updated Item' };
      vi.mocked(api.put).mockResolvedValue(updatedItem);

      const result = await updateItem(1, { name: 'Updated Item' });

      expect(api.put).toHaveBeenCalledWith('/items/1', { name: 'Updated Item' });
      expect(result?.name).toBe('Updated Item');
    });
  });

  describe('deleteItem', () => {
    it('returns false when item not found', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));

      const result = await deleteItem(999);

      expect(result).toBe(false);
    });

    it('deletes item via API', async () => {
      vi.mocked(api.delete).mockResolvedValue({ message: 'Item deleted' });

      const result = await deleteItem(1);

      expect(api.delete).toHaveBeenCalledWith('/items/1');
      expect(result).toBe(true);
    });
  });

  describe('getItemStats', () => {
    it('returns stats from API', async () => {
      vi.mocked(api.get).mockResolvedValue({ totalQuantity: 100, totalValue: 1500 });

      const result = await getItemStats();

      expect(api.get).toHaveBeenCalledWith('/items/stats');
      expect(result).toEqual({ totalQuantity: 100, totalValue: 1500 });
    });
  });

  describe('deleteItems', () => {
    it('deletes multiple items via API', async () => {
      vi.mocked(api.post).mockResolvedValue({ message: 'Deleted 2 items' });

      const result = await deleteItems([1, 2]);

      expect(api.post).toHaveBeenCalledWith('/items/bulk-delete', { ids: [1, 2] });
      expect(result).toBe(2);
    });
  });

  describe('updateItemsCategory', () => {
    it('updates category for multiple items via API', async () => {
      vi.mocked(api.put).mockResolvedValue({ message: 'Updated category for 2 items' });

      const result = await updateItemsCategory([1, 2], 'NewCategory');

      expect(api.put).toHaveBeenCalledWith('/items/bulk-category', { ids: [1, 2], category: 'NewCategory' });
      expect(result).toBe(2);
    });
  });

  describe('getLowStockItems', () => {
    it('returns items below threshold', async () => {
      const lowStockItems = [{ ...mockItem, quantity: 2 }];
      vi.mocked(api.get).mockResolvedValue(lowStockItems);

      const result = await getLowStockItems(5);

      expect(api.get).toHaveBeenCalledWith('/items/low-stock?threshold=5');
      expect(result).toEqual(lowStockItems);
    });
  });

  describe('getItemsNeedingReorder', () => {
    it('returns items needing reorder', async () => {
      const reorderItems = [{ ...mockItem, quantity: 3, reorderPoint: 5 }];
      vi.mocked(api.get).mockResolvedValue(reorderItems);

      const result = await getItemsNeedingReorder();

      expect(api.get).toHaveBeenCalledWith('/items/reorder');
      expect(result).toEqual(reorderItems);
    });
  });
});
