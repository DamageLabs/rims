import { Category, CategoryFormData } from '../types/Category';
import { categoryRepository } from './db/repositories';

/**
 * Get all categories sorted by sort_order
 */
export function getAllCategories(): Category[] {
  return categoryRepository.getAllSorted();
}

/**
 * Get all category names sorted by sort_order
 */
export function getCategoryNames(): string[] {
  return categoryRepository.getAllSorted().map((c) => c.name);
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: number): Category | null {
  return categoryRepository.getById(id);
}

/**
 * Create a new category
 */
export function createCategory(data: CategoryFormData): Category {
  if (!data.name.trim()) {
    throw new Error('Category name is required.');
  }

  if (categoryRepository.nameExists(data.name)) {
    throw new Error(`Category "${data.name}" already exists.`);
  }

  const now = new Date().toISOString();
  const sortOrder = data.sortOrder ?? categoryRepository.getNextSortOrder();

  return categoryRepository.create({
    name: data.name.trim(),
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Update a category
 */
export function updateCategory(id: number, data: Partial<CategoryFormData>): Category | null {
  const existing = categoryRepository.getById(id);
  if (!existing) {
    return null;
  }

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error('Category name is required.');
    }

    if (categoryRepository.nameExists(data.name, id)) {
      throw new Error(`Category "${data.name}" already exists.`);
    }
  }

  return categoryRepository.update(id, {
    ...data,
    name: data.name?.trim(),
    updatedAt: new Date().toISOString(),
  } as Partial<Category>);
}

/**
 * Delete a category
 */
export function deleteCategory(id: number): boolean {
  const category = categoryRepository.getById(id);
  if (!category) {
    throw new Error('Category not found.');
  }

  if (categoryRepository.isInUse(category.name)) {
    throw new Error(
      `Cannot delete "${category.name}" because it is assigned to items. Reassign those items first.`
    );
  }

  return categoryRepository.delete(id);
}

/**
 * Reorder categories
 */
export function reorderCategories(orderedIds: number[]): void {
  const updates = orderedIds.map((id, index) => ({ id, sortOrder: index }));
  categoryRepository.updateSortOrders(updates);
}

/**
 * Get item counts per category
 */
export function getCategoryItemCounts(): Array<{ name: string; count: number }> {
  return categoryRepository.getItemCounts();
}
