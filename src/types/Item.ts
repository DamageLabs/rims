export interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unitValue: number;
  value: number;
  picture: string | null;
  category: string;
  location: string;
  barcode: string;
  reorderPoint: number;
  inventoryTypeId: number;
  customFields: Record<string, unknown>;
  parentItemId: number | null;
  childCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ItemFormData = Omit<Item, 'id' | 'value' | 'createdAt' | 'updatedAt'>;

/**
 * @deprecated Use categoryService.getCategoryNames() for dynamic categories from the database.
 * This constant is retained only for seed/migration purposes.
 */
export const DEFAULT_CATEGORIES = [
  'Arduino',
  'Raspberry Pi',
  'BeagleBone',
  'Prototyping',
  'Kits & Projects',
  'Boards',
  'LCDs & Displays',
  'LEDs',
  'Power',
  'Cables',
  'Tools',
  'Robotics',
  'CNC',
  'Components & Parts',
  'Sensors',
  '3D Printing',
  'Wireless',
] as const;
