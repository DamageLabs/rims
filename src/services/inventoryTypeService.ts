import { InventoryType, InventoryTypeFormData, FieldDefinition } from '../types/InventoryType';
import { api } from './api';

export async function getAllTypes(): Promise<InventoryType[]> {
  return api.get<InventoryType[]>('/inventory-types');
}

export async function getTypeById(id: number): Promise<InventoryType | null> {
  try {
    return await api.get<InventoryType>(`/inventory-types/${id}`);
  } catch {
    return null;
  }
}

export async function createType(data: InventoryTypeFormData): Promise<InventoryType> {
  return api.post<InventoryType>('/inventory-types', data);
}

export async function updateType(id: number, data: Partial<InventoryTypeFormData>): Promise<InventoryType | null> {
  try {
    return await api.put<InventoryType>(`/inventory-types/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteType(id: number): Promise<boolean> {
  try {
    await api.delete(`/inventory-types/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function getTypeSchema(id: number): Promise<FieldDefinition[]> {
  const type = await getTypeById(id);
  return type?.schema || [];
}

export function validateCustomFields(
  customFields: Record<string, unknown>,
  schema: FieldDefinition[]
): string[] {
  const errors: string[] = [];
  for (const field of schema) {
    const value = customFields[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required.`);
    }
  }
  return errors;
}

export const PRESET_TYPES: InventoryTypeFormData[] = [
  {
    name: 'Electronics',
    icon: 'FaMicrochip',
    schema: [
      { key: 'modelNumber', label: 'Model Number', type: 'text', required: false, placeholder: 'e.g., R3, V3' },
      { key: 'partNumber', label: 'Part Number', type: 'text', required: false, placeholder: 'e.g., 50, 1501' },
      { key: 'vendorName', label: 'Vendor Name', type: 'text', required: false, placeholder: 'e.g., Adafruit, SparkFun' },
      { key: 'vendorUrl', label: 'Vendor URL', type: 'text', required: false, placeholder: 'https://...' },
    ],
  },
  {
    name: 'Firearms',
    icon: 'FaCrosshairs',
    schema: [
      { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
      { key: 'barrelLength', label: 'Barrel Length', type: 'text', required: false, placeholder: 'e.g., 16"' },
      { key: 'action', label: 'Action', type: 'select', required: false, options: ['Semi-Automatic', 'Bolt Action', 'Pump Action', 'Lever Action', 'Revolver', 'Single Shot', 'Full Auto'] },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
      { key: 'triggerPull', label: 'Trigger Pull', type: 'text', required: false, placeholder: 'e.g., 5.5 lbs' },
      { key: 'frame', label: 'Frame', type: 'select', required: false, options: ['Polymer', 'Aluminum', 'Steel', 'Titanium', 'Alloy'] },
      { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 30 oz' },
      { key: 'fflRequired', label: 'FFL Required', type: 'boolean', required: false },
      { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
    ],
  },
  {
    name: 'Ammunition',
    icon: 'FaShieldAlt',
    schema: [
      { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
      { key: 'grainWeight', label: 'Grain Weight', type: 'number', required: false, placeholder: 'e.g., 115, 55' },
      { key: 'cartridgeType', label: 'Cartridge Type', type: 'select', required: false, options: ['FMJ', 'JHP', 'SP', 'BTHP', 'Buckshot', 'Slug', 'Birdshot', 'Tracer', 'AP'] },
      { key: 'roundCount', label: 'Rounds Per Box', type: 'number', required: false, placeholder: 'e.g., 50, 20' },
      { key: 'casing', label: 'Casing', type: 'select', required: false, options: ['Brass', 'Steel', 'Aluminum', 'Nickel-Plated'] },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
    ],
  },
];
