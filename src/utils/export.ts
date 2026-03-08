import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Item } from '../types/Item';
import { formatCurrency } from './formatters';
import { APP_NAME } from '../constants/config';

export function exportToCSV(items: Item[]): void {
  const headers = [
    'ID',
    'Name',
    'Description',
    'Model Number',
    'Part Number',
    'Vendor Name',
    'Quantity',
    'Unit Value',
    'Total Value',
    'Category',
    'Location',
    'Vendor URL',
    'Created At',
    'Updated At',
  ];

  const rows = items.map((item) => [
    item.id,
    item.name,
    item.description,
    item.modelNumber,
    item.partNumber,
    item.vendorName,
    item.quantity,
    item.unitValue,
    item.value,
    item.category,
    item.location,
    item.vendorUrl,
    item.createdAt,
    item.updatedAt,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
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

  // Title
  doc.setFontSize(18);
  doc.text(`${APP_NAME} Inventory Report`, 14, 22);

  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  // Summary
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  doc.text(`Total Items: ${items.length} | Total Quantity: ${totalQuantity} | Total Value: ${formatCurrency(totalValue)}`, 14, 36);

  // Table
  const tableData = items.map((item) => [
    item.name,
    item.modelNumber,
    item.quantity.toString(),
    formatCurrency(item.unitValue),
    formatCurrency(item.value),
    item.vendorName,
    item.location,
    item.category,
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Name', 'Model #', 'Qty', 'Unit Value', 'Total Value', 'Vendor', 'Location', 'Category']],
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
