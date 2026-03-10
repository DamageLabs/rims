import { StockHistoryEntry, StockHistoryFilter } from '../types/StockHistory';
import { api } from './api';

export async function getAllHistory(): Promise<StockHistoryEntry[]> {
  return api.get<StockHistoryEntry[]>('/stock-history');
}

export async function getFilteredHistory(filter: StockHistoryFilter): Promise<StockHistoryEntry[]> {
  const params = new URLSearchParams();
  if (filter.itemId) params.set('itemId', String(filter.itemId));
  if (filter.changeType) params.set('changeType', filter.changeType);
  if (filter.startDate) params.set('startDate', filter.startDate);
  if (filter.endDate) params.set('endDate', filter.endDate);
  const qs = params.toString();
  return api.get<StockHistoryEntry[]>(`/stock-history${qs ? `?${qs}` : ''}`);
}

export async function getRecentHistory(limit: number = 10): Promise<StockHistoryEntry[]> {
  return api.get<StockHistoryEntry[]>(`/stock-history/recent?limit=${limit}`);
}

export async function getHistoryByItem(itemId: number): Promise<StockHistoryEntry[]> {
  return api.get<StockHistoryEntry[]>(`/stock-history/item/${itemId}`);
}

export async function getHistoryStats(startDate?: string, endDate?: string): Promise<StockHistoryEntry[]> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  return api.get<StockHistoryEntry[]>(`/stock-history/stats${qs ? `?${qs}` : ''}`);
}

export async function clearHistory(): Promise<void> {
  await api.delete('/stock-history');
}
