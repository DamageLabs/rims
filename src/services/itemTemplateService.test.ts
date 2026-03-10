import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTemplateFromItem,
} from './itemTemplateService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTemplate = {
  id: 1,
  name: 'Arduino Template',
  category: 'Arduino',
  defaultFields: { vendorName: 'Adafruit', location: 'Shelf A' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('itemTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTemplates', () => {
    it('returns all templates from API', async () => {
      vi.mocked(api.get).mockResolvedValue([mockTemplate]);
      const result = await getAllTemplates();
      expect(api.get).toHaveBeenCalledWith('/templates');
      expect(result).toEqual([mockTemplate]);
    });
  });

  describe('getTemplateById', () => {
    it('returns template when found', async () => {
      vi.mocked(api.get).mockResolvedValue(mockTemplate);
      const result = await getTemplateById(1);
      expect(api.get).toHaveBeenCalledWith('/templates/1');
      expect(result).toEqual(mockTemplate);
    });

    it('returns null when not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      const result = await getTemplateById(999);
      expect(result).toBeNull();
    });
  });

  describe('createTemplate', () => {
    it('creates template via API', async () => {
      const formData = { name: 'New', category: 'Sensors', defaultFields: {} };
      vi.mocked(api.post).mockResolvedValue({ ...mockTemplate, ...formData, id: 2 });
      const result = await createTemplate(formData);
      expect(api.post).toHaveBeenCalledWith('/templates', formData);
      expect(result.name).toBe('New');
    });
  });

  describe('updateTemplate', () => {
    it('updates template via API', async () => {
      vi.mocked(api.put).mockResolvedValue({ ...mockTemplate, name: 'Updated' });
      const result = await updateTemplate(1, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/templates/1', { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Not found'));
      const result = await updateTemplate(999, { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTemplate', () => {
    it('returns true on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({});
      const result = await deleteTemplate(1);
      expect(api.delete).toHaveBeenCalledWith('/templates/1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Not found'));
      const result = await deleteTemplate(999);
      expect(result).toBe(false);
    });
  });

  describe('createTemplateFromItem', () => {
    it('creates template from item with custom fields', async () => {
      vi.mocked(api.post).mockResolvedValue({ ...mockTemplate, id: 3, name: 'From Item' });

      const result = await createTemplateFromItem('From Item', {
        category: 'Electronics',
        location: 'Shelf B',
        reorderPoint: 5,
        description: 'A widget',
        customFields: { vendorName: 'SparkFun', vendorUrl: 'https://sparkfun.com' },
      });

      expect(api.post).toHaveBeenCalledWith('/templates', {
        name: 'From Item',
        category: 'Electronics',
        defaultFields: {
          vendorName: 'SparkFun',
          vendorUrl: 'https://sparkfun.com',
          location: 'Shelf B',
          reorderPoint: 5,
          description: 'A widget',
        },
      });
      expect(result.name).toBe('From Item');
    });

    it('handles missing optional fields with defaults', async () => {
      vi.mocked(api.post).mockResolvedValue({ ...mockTemplate, id: 4, name: 'Minimal' });

      await createTemplateFromItem('Minimal', { category: 'Misc' });

      expect(api.post).toHaveBeenCalledWith('/templates', {
        name: 'Minimal',
        category: 'Misc',
        defaultFields: {
          vendorName: '',
          vendorUrl: '',
          location: '',
          reorderPoint: 0,
          description: '',
        },
      });
    });
  });
});
