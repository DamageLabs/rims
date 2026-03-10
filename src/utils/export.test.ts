import { describe, it, expect } from 'vitest';
import { generateBackupJSON, generateBackupCSV } from './export';
import { Item } from '../types/Item';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    name: 'Test Item',
    description: 'A test item',
    quantity: 10,
    unitValue: 5.99,
    value: 59.90,
    picture: null,
    category: 'Electronics',
    location: 'Shelf A',
    barcode: 'RIMS-0001',
    reorderPoint: 3,
    inventoryTypeId: 1,
    customFields: { partNumber: '123', vendorName: 'Acme' },
    parentItemId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('generateBackupJSON', () => {
  it('produces valid JSON with all Item fields', () => {
    const result = generateBackupJSON([makeItem()]);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].name).toBe('Test Item');
    expect(parsed[0].inventoryTypeId).toBe(1);
    expect(parsed[0].parentItemId).toBeNull();
    expect(parsed[0].barcode).toBe('RIMS-0001');
    expect(parsed[0].reorderPoint).toBe(3);
    expect(parsed[0].customFields.partNumber).toBe('123');
  });

  it('handles empty array', () => {
    const result = generateBackupJSON([]);
    expect(JSON.parse(result)).toEqual([]);
  });

  it('includes multiple items', () => {
    const items = [makeItem(), makeItem({ id: 2, name: 'Second' })];
    const parsed = JSON.parse(generateBackupJSON(items));
    expect(parsed).toHaveLength(2);
    expect(parsed[1].name).toBe('Second');
  });
});

describe('generateBackupCSV', () => {
  it('includes all expected column headers', () => {
    const result = generateBackupCSV([makeItem()]);
    const headerLine = result.split('\n')[0];
    for (const col of [
      'ID', 'Name', 'Description', 'Quantity', 'Unit Value', 'Total Value',
      'Category', 'Location', 'Inventory Type ID', 'Parent Item ID',
      'Barcode', 'Reorder Point', 'Created At', 'Updated At',
    ]) {
      expect(headerLine).toContain(col);
    }
  });

  it('includes custom field columns', () => {
    const result = generateBackupCSV([makeItem()]);
    const headerLine = result.split('\n')[0];
    expect(headerLine).toContain('partNumber');
    expect(headerLine).toContain('vendorName');
  });

  it('merges custom field columns from multiple items', () => {
    const result = generateBackupCSV([
      makeItem({ customFields: { fieldA: 'a' } }),
      makeItem({ id: 2, customFields: { fieldB: 'b' } }),
    ]);
    const headerLine = result.split('\n')[0];
    expect(headerLine).toContain('fieldA');
    expect(headerLine).toContain('fieldB');
  });

  it('escapes values with commas and quotes', () => {
    const result = generateBackupCSV([makeItem({ name: 'Item, with "quotes"' })]);
    const dataLine = result.split('\n')[1];
    expect(dataLine).toContain('"Item, with ""quotes"""');
  });

  it('renders null parentItemId as empty', () => {
    const result = generateBackupCSV([makeItem({ parentItemId: null })]);
    const dataLine = result.split('\n')[1];
    expect(dataLine).not.toContain('null');
  });

  it('includes parentItemId when present', () => {
    const result = generateBackupCSV([makeItem({ parentItemId: 42 })]);
    const dataLine = result.split('\n')[1];
    expect(dataLine).toContain('42');
  });

  it('handles empty array with header only', () => {
    const result = generateBackupCSV([]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('ID');
  });

  it('has correct number of columns per row', () => {
    const result = generateBackupCSV([makeItem()]);
    const lines = result.split('\n');
    const headerCols = lines[0].split(',').length;
    // Data row may have quoted fields, so parse carefully
    expect(lines).toHaveLength(2);
    // Both header and data should have same column count
    // Simple check: count commas (works when no commas in data for this item)
    const item = makeItem({ name: 'Simple', description: 'No commas' });
    const simple = generateBackupCSV([item]);
    const simpleLines = simple.split('\n');
    const hCols = simpleLines[0].split(',').length;
    const dCols = simpleLines[1].split(',').length;
    expect(hCols).toBe(dCols);
  });
});
