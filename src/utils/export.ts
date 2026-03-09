import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Item } from '../types/Item';
import { formatCurrency } from './formatters';
import { APP_NAME } from '../constants/config';

export function exportToCSV(items: Item[]): void {
  // Collect all unique custom field keys across items
  const customFieldKeys = new Set<string>();
  for (const item of items) {
    if (item.customFields) {
      for (const key of Object.keys(item.customFields)) {
        customFieldKeys.add(key);
      }
    }
  }
  const cfKeys = Array.from(customFieldKeys);

  const headers = [
    'ID',
    'Name',
    'Description',
    'Quantity',
    'Unit Value',
    'Total Value',
    'Category',
    'Location',
    ...cfKeys,
    'Created At',
    'Updated At',
  ];

  const rows = items.map((item) => [
    item.id,
    item.name,
    item.description,
    item.quantity,
    item.unitValue,
    item.value,
    item.category,
    item.location,
    ...cfKeys.map((key) => item.customFields?.[key] ?? ''),
    item.createdAt,
    item.updatedAt,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, `${APP_NAME.toLowerCase()}-inventory-${getDateStamp()}.csv`, 'text/csv');
}

export function exportToPDF(items: Item[]): void {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.text(`${APP_NAME} Inventory Report`, 14, 22);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  doc.text(`Total Items: ${items.length} | Total Quantity: ${totalQuantity} | Total Value: ${formatCurrency(totalValue)}`, 14, 36);

  const tableData = items.map((item) => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.unitValue),
    formatCurrency(item.value),
    item.location,
    item.category,
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Name', 'Qty', 'Unit Value', 'Total Value', 'Location', 'Category']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${APP_NAME.toLowerCase()}-inventory-${getDateStamp()}.pdf`);
}

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
