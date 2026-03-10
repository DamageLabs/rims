import { Category, CategoryFormData } from '../types/Category';
import { api } from './api';

export async function getAllCategories(): Promise<Category[]> {
  return api.get<Category[]>('/categories');
}

export async function getCategoriesByType(inventoryTypeId: number): Promise<Category[]> {
  return api.get<Category[]>(`/categories?typeId=${inventoryTypeId}`);
}

export async function getCategoryNamesByType(inventoryTypeId: number): Promise<string[]> {
  const cats = await getCategoriesByType(inventoryTypeId);
  return cats.map((c) => c.name);
}

export async function getCategoryNames(): Promise<string[]> {
  const cats = await getAllCategories();
  return cats.map((c) => c.name);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    return await api.get<Category>(`/categories/${id}`);
  } catch {
    return null;
  }
}

export async function createCategory(data: CategoryFormData): Promise<Category> {
  return api.post<Category>('/categories', data);
}

export async function updateCategory(id: number, data: Partial<CategoryFormData>): Promise<Category | null> {
  try {
    return await api.put<Category>(`/categories/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await api.delete(`/categories/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function reorderCategories(orderedIds: number[]): Promise<void> {
  await api.put('/categories/reorder', { orderedIds });
}

export async function getCategoryItemCounts(): Promise<Array<{ name: string; count: number }>> {
  return api.get('/categories/counts');
}
