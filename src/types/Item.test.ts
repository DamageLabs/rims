import { describe, it, expect } from 'vitest';
import type { Item, ItemFormData } from './Item';
import { DEFAULT_CATEGORIES } from './Item';

describe('Item types', () => {
  describe('Item interface', () => {
    it('accepts valid item object', () => {
      const item: Item = {
        id: 1,
        name: 'Test Item',
        description: 'A test item description',
        modelNumber: 'TM-001',
        partNumber: 'VP-001',
        vendorName: 'Test Vendor',
        quantity: 10,
        unitValue: 5.99,
        value: 59.9,
        picture: null,
        vendorUrl: 'https://vendor.com/item',
        category: 'Arduino',
        location: 'Shelf A1',
        barcode: '123456789',
        reorderPoint: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(item.id).toBe(1);
      expect(item.name).toBe('Test Item');
      expect(item.quantity).toBe(10);
      expect(item.value).toBe(59.9);
    });

    it('accepts item with picture', () => {
      const item: Item = {
        id: 1,
        name: 'Test Item',
        description: 'Description',
        modelNumber: 'TM-001',
        partNumber: 'VP-001',
        vendorName: 'Vendor',
        quantity: 5,
        unitValue: 10.0,
        value: 50.0,
        picture: 'data:image/png;base64,abc123',
        vendorUrl: '',
        category: 'Components & Parts',
        location: 'Bin B2',
        barcode: '',
        reorderPoint: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(item.picture).toBe('data:image/png;base64,abc123');
    });
  });

  describe('ItemFormData type', () => {
    it('excludes id, value, createdAt, and updatedAt', () => {
      const formData: ItemFormData = {
        name: 'New Item',
        description: 'Description',
        modelNumber: 'NI-001',
        partNumber: 'VP-001',
        vendorName: 'Vendor',
        quantity: 1,
        unitValue: 9.99,
        picture: null,
        vendorUrl: '',
        category: 'LEDs',
        location: 'Drawer 1',
        barcode: '',
        reorderPoint: 0,
      };

      expect(formData.name).toBe('New Item');
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('value');
      expect(formData).not.toHaveProperty('createdAt');
      expect(formData).not.toHaveProperty('updatedAt');
    });
  });

  describe('DEFAULT_CATEGORIES constant', () => {
    it('contains expected categories', () => {
      expect(DEFAULT_CATEGORIES).toContain('Arduino');
      expect(DEFAULT_CATEGORIES).toContain('Raspberry Pi');
      expect(DEFAULT_CATEGORIES).toContain('Components & Parts');
      expect(DEFAULT_CATEGORIES).toContain('Sensors');
      expect(DEFAULT_CATEGORIES).toContain('3D Printing');
    });

    it('has expected number of categories', () => {
      expect(DEFAULT_CATEGORIES.length).toBe(17);
    });

    it('categories are unique', () => {
      const uniqueCategories = new Set(DEFAULT_CATEGORIES);
      expect(uniqueCategories.size).toBe(DEFAULT_CATEGORIES.length);
    });
  });
});
