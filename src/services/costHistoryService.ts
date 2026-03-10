import { CostHistoryEntry, CostStats } from '../types/CostHistory';
import { api } from './api';

export async function getCostHistoryForItem(itemId: number): Promise<CostHistoryEntry[]> {
  return api.get<CostHistoryEntry[]>(`/cost-history/item/${itemId}`);
}

export async function getCostStats(itemId: number, currentValue: number): Promise<CostStats> {
  const result = await api.get<{ history: CostHistoryEntry[]; stats: { min: number; max: number; avg: number; trend: string } }>(
    `/cost-history/item/${itemId}/stats?currentValue=${currentValue}`
  );

  return {
    min: result.stats.min,
    max: result.stats.max,
    avg: Math.round(result.stats.avg * 100) / 100,
    current: currentValue,
    changeCount: result.history.length,
    trend: result.stats.trend as 'up' | 'down' | 'stable',
    firstRecorded: result.history[0]?.timestamp || null,
    lastChanged: result.history[result.history.length - 1]?.timestamp || null,
  };
}

export async function deleteCostHistoryForItem(itemId: number): Promise<number> {
  const result = await api.delete<{ deleted: number }>(`/cost-history/item/${itemId}`);
  return result.deleted;
}
