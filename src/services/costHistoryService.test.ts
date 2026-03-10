import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCostHistoryForItem, getCostStats, deleteCostHistoryForItem } from './costHistoryService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockEntry = {
  id: 1,
  itemId: 10,
  oldValue: 24.95,
  newValue: 29.95,
  source: 'manual',
  timestamp: '2026-01-01T00:00:00Z',
};

describe('costHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCostHistoryForItem', () => {
    it('returns cost history entries for an item', async () => {
      vi.mocked(api.get).mockResolvedValue([mockEntry]);
      const result = await getCostHistoryForItem(10);
      expect(api.get).toHaveBeenCalledWith('/cost-history/item/10');
      expect(result).toEqual([mockEntry]);
    });
  });

  describe('getCostStats', () => {
    it('transforms API response into CostStats', async () => {
      vi.mocked(api.get).mockResolvedValue({
        history: [
          { ...mockEntry, timestamp: '2026-01-01T00:00:00Z' },
          { ...mockEntry, id: 2, timestamp: '2026-03-01T00:00:00Z' },
        ],
        stats: { min: 20, max: 35, avg: 27.555, trend: 'up' },
      });

      const result = await getCostStats(10, 29.95);

      expect(api.get).toHaveBeenCalledWith('/cost-history/item/10/stats?currentValue=29.95');
      expect(result.min).toBe(20);
      expect(result.max).toBe(35);
      expect(result.avg).toBe(27.56);
      expect(result.current).toBe(29.95);
      expect(result.changeCount).toBe(2);
      expect(result.trend).toBe('up');
      expect(result.firstRecorded).toBe('2026-01-01T00:00:00Z');
      expect(result.lastChanged).toBe('2026-03-01T00:00:00Z');
    });

    it('handles empty history', async () => {
      vi.mocked(api.get).mockResolvedValue({
        history: [],
        stats: { min: 0, max: 0, avg: 0, trend: 'stable' },
      });

      const result = await getCostStats(10, 0);

      expect(result.changeCount).toBe(0);
      expect(result.firstRecorded).toBeNull();
      expect(result.lastChanged).toBeNull();
    });
  });

  describe('deleteCostHistoryForItem', () => {
    it('returns number of deleted entries', async () => {
      vi.mocked(api.delete).mockResolvedValue({ deleted: 5 });
      const result = await deleteCostHistoryForItem(10);
      expect(api.delete).toHaveBeenCalledWith('/cost-history/item/10');
      expect(result).toBe(5);
    });
  });
});
