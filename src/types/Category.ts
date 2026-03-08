export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFormData = Pick<Category, 'name' | 'sortOrder'>;
