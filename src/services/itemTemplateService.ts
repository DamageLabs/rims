import { ItemTemplate, ItemTemplateFormData } from '../types/ItemTemplate';
import { api } from './api';

export async function getAllTemplates(): Promise<ItemTemplate[]> {
  return api.get<ItemTemplate[]>('/templates');
}

export async function getTemplateById(id: number): Promise<ItemTemplate | null> {
  try {
    return await api.get<ItemTemplate>(`/templates/${id}`);
  } catch {
    return null;
  }
}

export async function createTemplate(data: ItemTemplateFormData): Promise<ItemTemplate> {
  return api.post<ItemTemplate>('/templates', data);
}

export async function updateTemplate(id: number, data: Partial<ItemTemplateFormData>): Promise<ItemTemplate | null> {
  try {
    return await api.put<ItemTemplate>(`/templates/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteTemplate(id: number): Promise<boolean> {
  try {
    await api.delete(`/templates/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function createTemplateFromItem(
  name: string,
  item: {
    category: string;
    location?: string;
    reorderPoint?: number;
    description?: string;
    customFields?: Record<string, unknown>;
  }
): Promise<ItemTemplate> {
  return createTemplate({
    name,
    category: item.category,
    defaultFields: {
      vendorName: (item.customFields?.vendorName as string) || '',
      vendorUrl: (item.customFields?.vendorUrl as string) || '',
      location: item.location || '',
      reorderPoint: item.reorderPoint || 0,
      description: item.description || '',
    },
  });
}
