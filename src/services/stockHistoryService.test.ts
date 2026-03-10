import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllHistory,
  getFilteredHistory,
  getRecentHistory,
  getHistoryByItem,
  getHistoryStats,
  clearHistory,
} from './stockHistoryService';
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
  itemName: 'Resistor Pack',
  changeType: 'updated' as const,
  quantityChange: 5,
  previousQuantity: 10,
  newQuantity: 15,
  reason: 'Restocked',
  timestamp: '2026-01-01T00:00:00Z',
};

describe('stockHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllHistory', () => {
    it('returns all stock history', async () => {
      vi.mocked(api.get).mockResolvedValue([mockEntry]);
      const result = await getAllHistory();
      expect(api.get).toHaveBeenCalledWith('/stock-history');
      expect(result).toEqual([mockEntry]);
    });
  });

  describe('getFilteredHistory', () => {
    it('sends all filter params when provided', async () => {
      vi.mocked(api.get).mockResolvedValue([mockEntry]);
      const filter = {
        itemId: 10,
        changeType: 'updated' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };
      await getFilteredHistory(filter);
      expect(api.get).toHaveBeenCalledWith(
        '/stock-history?itemId=10&changeType=updated&startDate=2026-01-01&endDate=2026-12-31'
      );
    });

    it('omits empty filter params', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getFilteredHistory({});
      expect(api.get).toHaveBeenCalledWith('/stock-history');
    });

    it('sends partial filter params', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getFilteredHistory({ itemId: 5 });
      expect(api.get).toHaveBeenCalledWith('/stock-history?itemId=5');
    });
  });

  describe('getRecentHistory', () => {
    it('uses default limit of 10', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getRecentHistory();
      expect(api.get).toHaveBeenCalledWith('/stock-history/recent?limit=10');
    });

    it('uses custom limit', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getRecentHistory(25);
      expect(api.get).toHaveBeenCalledWith('/stock-history/recent?limit=25');
    });
  });

  describe('getHistoryByItem', () => {
    it('returns history for specific item', async () => {
      vi.mocked(api.get).mockResolvedValue([mockEntry]);
      const result = await getHistoryByItem(10);
      expect(api.get).toHaveBeenCalledWith('/stock-history/item/10');
      expect(result).toEqual([mockEntry]);
    });
  });

  describe('getHistoryStats', () => {
    it('sends date range params', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getHistoryStats('2026-01-01', '2026-12-31');
      expect(api.get).toHaveBeenCalledWith('/stock-history/stats?startDate=2026-01-01&endDate=2026-12-31');
    });

    it('omits params when not provided', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await getHistoryStats();
      expect(api.get).toHaveBeenCalledWith('/stock-history/stats');
    });
  });

  describe('clearHistory', () => {
    it('deletes all stock history', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);
      await clearHistory();
      expect(api.delete).toHaveBeenCalledWith('/stock-history');
    });
  });
});
