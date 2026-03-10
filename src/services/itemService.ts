import { Item, ItemFormData } from '../types/Item';
import { api } from './api';

export async function getAllItems(): Promise<Item[]> {
  return api.get<Item[]>('/items');
}

export async function getItemById(id: number): Promise<Item | null> {
  try {
    return await api.get<Item>(`/items/${id}`);
  } catch {
    return null;
  }
}

export async function createItem(data: ItemFormData): Promise<Item> {
  return api.post<Item>('/items', data);
}

export async function updateItem(id: number, data: Partial<ItemFormData>): Promise<Item | null> {
  try {
    return await api.put<Item>(`/items/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteItem(id: number): Promise<boolean> {
  try {
    await api.delete(`/items/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function getTotalQuantity(): Promise<number> {
  const stats = await api.get<{ totalQuantity: number; totalValue: number }>('/items/stats');
  return stats.totalQuantity;
}

export async function getTotalValue(): Promise<number> {
  const stats = await api.get<{ totalQuantity: number; totalValue: number }>('/items/stats');
  return stats.totalValue;
}

export async function getItemStats(): Promise<{ totalQuantity: number; totalValue: number }> {
  return api.get('/items/stats');
}

export async function deleteItems(ids: number[]): Promise<number> {
  await api.post('/items/bulk-delete', { ids });
  return ids.length;
}

export async function updateItemsCategory(ids: number[], category: string): Promise<number> {
  await api.put('/items/bulk-category', { ids, category });
  return ids.length;
}

export async function getLowStockItems(threshold: number): Promise<Item[]> {
  return api.get<Item[]>(`/items/low-stock?threshold=${threshold}`);
}

export async function getItemsNeedingReorder(): Promise<Item[]> {
  return api.get<Item[]>('/items/reorder');
}

export async function getItemChildren(id: number): Promise<Item[]> {
  return api.get<Item[]>(`/items/${id}/children`);
}
