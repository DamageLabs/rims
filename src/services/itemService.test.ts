import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getTotalQuantity,
  getTotalValue,
  deleteItems,
  updateItemsCategory,
  getLowStockItems,
  getItemsNeedingReorder,
} from './itemService';
import { itemRepository } from './db/repositories';
import * as stockHistoryService from './stockHistoryService';
import * as costHistoryService from './costHistoryService';

vi.mock('./db/repositories', () => ({
  itemRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    createWithValue: vi.fn(),
    updateWithValue: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    getTotalQuantity: vi.fn(),
    getTotalValue: vi.fn(),
    updateCategoryBulk: vi.fn(),
    getLowStock: vi.fn(),
    getItemsNeedingReorder: vi.fn(),
  },
}));

vi.mock('./stockHistoryService', () => ({
  recordItemCreated: vi.fn(),
  recordItemUpdated: vi.fn(),
  recordItemDeleted: vi.fn(),
  recordBulkCategoryChange: vi.fn(),
}));

vi.mock('./costHistoryService', () => ({
  recordCostChange: vi.fn(),
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
    it('returns all items from repository', () => {
      const items = [mockItem, { ...mockItem, id: 2, name: 'Item 2' }];
      vi.mocked(itemRepository.getAll).mockReturnValue(items);

      const result = getAllItems();

      expect(itemRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(items);
    });
  });

  describe('getItemById', () => {
    it('returns item when found', () => {
      vi.mocked(itemRepository.getById).mockReturnValue(mockItem);

      const result = getItemById(1);

      expect(itemRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockItem);
    });

    it('returns null when not found', () => {
      vi.mocked(itemRepository.getById).mockReturnValue(null);

      const result = getItemById(999);

      expect(result).toBeNull();
    });
  });

  describe('createItem', () => {
    it('creates item and records history', () => {
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
      vi.mocked(itemRepository.createWithValue).mockReturnValue({ ...mockItem, ...formData, id: 2, value: 50.0 });

      const result = createItem(formData);

      expect(itemRepository.createWithValue).toHaveBeenCalledWith(
        expect.objectContaining({
          ...formData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
      expect(stockHistoryService.recordItemCreated).toHaveBeenCalled();
      expect(result.name).toBe('New Item');
    });
  });

  describe('updateItem', () => {
    it('returns null when item not found', () => {
      vi.mocked(itemRepository.getById).mockReturnValue(null);

      const result = updateItem(999, { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('updates item and records history', () => {
      const updatedItem = { ...mockItem, name: 'Updated Item' };
      vi.mocked(itemRepository.getById).mockReturnValue(mockItem);
      vi.mocked(itemRepository.updateWithValue).mockReturnValue(updatedItem);

      const result = updateItem(1, { name: 'Updated Item' });

      expect(itemRepository.updateWithValue).toHaveBeenCalled();
      expect(stockHistoryService.recordItemUpdated).toHaveBeenCalledWith(mockItem, updatedItem);
      expect(result?.name).toBe('Updated Item');
    });

    it('records cost change when unitValue changes', () => {
      const updatedItem = { ...mockItem, unitValue: 7.99 };
      vi.mocked(itemRepository.getById).mockReturnValue(mockItem);
      vi.mocked(itemRepository.updateWithValue).mockReturnValue(updatedItem);

      updateItem(1, { unitValue: 7.99 });

      expect(costHistoryService.recordCostChange).toHaveBeenCalledWith(
        1,
        5.99,
        7.99,
        'manual'
      );
    });

    it('uses provided cost source', () => {
      const updatedItem = { ...mockItem, unitValue: 7.99 };
      vi.mocked(itemRepository.getById).mockReturnValue(mockItem);
      vi.mocked(itemRepository.updateWithValue).mockReturnValue(updatedItem);

      updateItem(1, { unitValue: 7.99 }, 'vendor_lookup');

      expect(costHistoryService.recordCostChange).toHaveBeenCalledWith(
        1,
        5.99,
        7.99,
        'vendor_lookup'
      );
    });
  });

  describe('deleteItem', () => {
    it('returns false when item not found', () => {
      vi.mocked(itemRepository.getById).mockReturnValue(null);

      const result = deleteItem(999);

      expect(result).toBe(false);
    });

    it('deletes item and records history', () => {
      vi.mocked(itemRepository.getById).mockReturnValue(mockItem);
      vi.mocked(itemRepository.delete).mockReturnValue(true);

      const result = deleteItem(1);

      expect(itemRepository.delete).toHaveBeenCalledWith(1);
      expect(stockHistoryService.recordItemDeleted).toHaveBeenCalledWith(mockItem);
      expect(result).toBe(true);
    });
  });

  describe('getTotalQuantity', () => {
    it('returns total quantity from repository', () => {
      vi.mocked(itemRepository.getTotalQuantity).mockReturnValue(100);

      const result = getTotalQuantity();

      expect(result).toBe(100);
    });
  });

  describe('getTotalValue', () => {
    it('returns total value from repository', () => {
      vi.mocked(itemRepository.getTotalValue).mockReturnValue(1500.0);

      const result = getTotalValue();

      expect(result).toBe(1500.0);
    });
  });

  describe('deleteItems', () => {
    it('deletes multiple items and records history for each', () => {
      const items = [mockItem, { ...mockItem, id: 2 }];
      vi.mocked(itemRepository.getById)
        .mockReturnValueOnce(items[0])
        .mockReturnValueOnce(items[1]);
      vi.mocked(itemRepository.deleteMany).mockReturnValue(2);

      const result = deleteItems([1, 2]);

      expect(itemRepository.deleteMany).toHaveBeenCalledWith([1, 2]);
      expect(stockHistoryService.recordItemDeleted).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });
  });

  describe('updateItemsCategory', () => {
    it('updates category for multiple items', () => {
      vi.mocked(itemRepository.getById)
        .mockReturnValueOnce(mockItem)
        .mockReturnValueOnce({ ...mockItem, id: 2 })
        .mockReturnValueOnce({ ...mockItem, category: 'NewCategory' })
        .mockReturnValueOnce({ ...mockItem, id: 2, category: 'NewCategory' });
      vi.mocked(itemRepository.updateCategoryBulk).mockReturnValue(2);

      const result = updateItemsCategory([1, 2], 'NewCategory');

      expect(itemRepository.updateCategoryBulk).toHaveBeenCalled();
      expect(stockHistoryService.recordBulkCategoryChange).toHaveBeenCalled();
      expect(result).toBe(2);
    });
  });

  describe('getLowStockItems', () => {
    it('returns items below threshold', () => {
      const lowStockItems = [{ ...mockItem, quantity: 2 }];
      vi.mocked(itemRepository.getLowStock).mockReturnValue(lowStockItems);

      const result = getLowStockItems(5);

      expect(itemRepository.getLowStock).toHaveBeenCalledWith(5);
      expect(result).toEqual(lowStockItems);
    });
  });

  describe('getItemsNeedingReorder', () => {
    it('returns items needing reorder', () => {
      const reorderItems = [{ ...mockItem, quantity: 3, reorderPoint: 5 }];
      vi.mocked(itemRepository.getItemsNeedingReorder).mockReturnValue(reorderItems);

      const result = getItemsNeedingReorder();

      expect(itemRepository.getItemsNeedingReorder).toHaveBeenCalled();
      expect(result).toEqual(reorderItems);
    });
  });
});
