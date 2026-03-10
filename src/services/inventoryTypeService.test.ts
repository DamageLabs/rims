import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,
  getTypeSchema,
  validateCustomFields,
  PRESET_TYPES,
} from './inventoryTypeService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockType = {
  id: 1,
  name: 'Electronics',
  icon: 'FaMicrochip',
  schema: [
    { key: 'modelNumber', label: 'Model Number', type: 'text' as const, required: false },
    { key: 'partNumber', label: 'Part Number', type: 'text' as const, required: true },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('inventoryTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTypes', () => {
    it('returns all types from API', async () => {
      vi.mocked(api.get).mockResolvedValue([mockType]);
      const result = await getAllTypes();
      expect(api.get).toHaveBeenCalledWith('/inventory-types');
      expect(result).toEqual([mockType]);
    });
  });

  describe('getTypeById', () => {
    it('returns type when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockType);
      const result = await getTypeById(1);
      expect(api.get).toHaveBeenCalledWith('/inventory-types/1');
      expect(result).toEqual(mockType);
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      const result = await getTypeById(999);
      expect(result).toBeNull();
    });
  });

  describe('createType', () => {
    it('creates type via API', async () => {
      const formData = { name: 'Tools', icon: 'FaWrench', schema: [] };
      vi.mocked(api.post).mockResolvedValue({ ...mockType, ...formData, id: 2 });
      const result = await createType(formData);
      expect(api.post).toHaveBeenCalledWith('/inventory-types', formData);
      expect(result.name).toBe('Tools');
    });
  });

  describe('updateType', () => {
    it('updates type via API', async () => {
      vi.mocked(api.put).mockResolvedValue({ ...mockType, name: 'Updated' });
      const result = await updateType(1, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/inventory-types/1', { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Not found'));
      const result = await updateType(999, { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteType', () => {
    it('returns true on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({});
      const result = await deleteType(1);
      expect(api.delete).toHaveBeenCalledWith('/inventory-types/1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));
      const result = await deleteType(999);
      expect(result).toBe(false);
    });
  });

  describe('getTypeSchema', () => {
    it('returns schema for existing type', async () => {
      vi.mocked(api.get).mockResolvedValue(mockType);
      const result = await getTypeSchema(1);
      expect(result).toEqual(mockType.schema);
    });

    it('returns empty array when type not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      const result = await getTypeSchema(999);
      expect(result).toEqual([]);
    });
  });

  describe('validateCustomFields', () => {
    it('returns no errors when all required fields present', () => {
      const errors = validateCustomFields(
        { partNumber: 'VP-001', modelNumber: 'TM-001' },
        mockType.schema
      );
      expect(errors).toHaveLength(0);
    });

    it('returns error for missing required field', () => {
      const errors = validateCustomFields(
        { modelNumber: 'TM-001' },
        mockType.schema
      );
      expect(errors).toContain('Part Number is required.');
    });

    it('returns error for empty string required field', () => {
      const errors = validateCustomFields(
        { partNumber: '' },
        mockType.schema
      );
      expect(errors).toContain('Part Number is required.');
    });

    it('returns error for null required field', () => {
      const errors = validateCustomFields(
        { partNumber: null } as unknown as Record<string, unknown>,
        mockType.schema
      );
      expect(errors).toContain('Part Number is required.');
    });

    it('allows optional fields to be missing', () => {
      const errors = validateCustomFields(
        { partNumber: 'VP-001' },
        mockType.schema
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('PRESET_TYPES', () => {
    it('contains expected preset types', () => {
      const names = PRESET_TYPES.map((t) => t.name);
      expect(names).toContain('Electronics');
      expect(names).toContain('Firearms');
      expect(names).toContain('Ammunition');
      expect(names).toContain('Optics');
      expect(names).toContain('Lights');
    });

    it('all presets have name, icon, and schema', () => {
      for (const preset of PRESET_TYPES) {
        expect(preset.name).toBeTruthy();
        expect(preset.icon).toBeTruthy();
        expect(Array.isArray(preset.schema)).toBe(true);
        expect(preset.schema.length).toBeGreaterThan(0);
      }
    });
  });
});
