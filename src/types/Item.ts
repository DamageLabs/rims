export interface Item {
  id: number;
  name: string;
  description: string;
  productModelNumber: string;
  vendorPartNumber: string;
  vendorName: string;
  quantity: number;
  unitValue: number;
  value: number;
  picture: string | null;
  vendorUrl: string;
  category: string;
  location: string;
  barcode: string;
  reorderPoint: number;
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
