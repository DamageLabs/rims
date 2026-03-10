import { BOM, BOMFormData, BOMCostBreakdown } from '../types/BOM';
import { api } from './api';

export async function getAllBOMs(): Promise<BOM[]> {
  return api.get<BOM[]>('/boms');
}

export async function getBOMById(id: number): Promise<BOM | null> {
  try {
    return await api.get<BOM>(`/boms/${id}`);
  } catch {
    return null;
  }
}

export async function createBOM(data: BOMFormData): Promise<BOM> {
  return api.post<BOM>('/boms', data);
}

export async function updateBOM(id: number, data: Partial<BOMFormData>): Promise<BOM | null> {
  try {
    return await api.put<BOM>(`/boms/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteBOM(id: number): Promise<boolean> {
  try {
    await api.delete(`/boms/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function calculateBOMCost(bomId: number): Promise<BOMCostBreakdown | null> {
  try {
    return await api.get<BOMCostBreakdown>(`/boms/${bomId}/cost`);
  } catch {
    return null;
  }
}

export async function checkAvailability(bomId: number): Promise<{ canBuild: boolean; missingItems: string[] }> {
  const breakdown = await calculateBOMCost(bomId);
  if (!breakdown) {
    return { canBuild: false, missingItems: [] };
  }

  const missingItems = breakdown.itemCosts
    .filter((ic) => !ic.canBuild)
    .map((ic) => `${ic.itemName} (need ${ic.quantity}, have ${ic.available})`);

  return {
    canBuild: missingItems.length === 0,
    missingItems,
  };
}

export async function duplicateBOM(id: number, newName: string): Promise<BOM | null> {
  try {
    return await api.post<BOM>(`/boms/${id}/duplicate`, { name: newName });
  } catch {
    return null;
  }
}
