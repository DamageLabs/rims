import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Table, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaFileUpload, FaCheck, FaTimes, FaDownload } from 'react-icons/fa';
import Papa from 'papaparse';
import * as itemService from '../../services/itemService';
import * as categoryService from '../../services/categoryService';
import { ItemFormData } from '../../types/Item';
import { useAlert } from '../../contexts/AlertContext';

interface ImportRow {
  name: string;
  description: string;
  modelNumber: string;
  partNumber: string;
  vendorName: string;
  quantity: number;
  unitValue: number;
  vendorUrl: string;
  category: string;
  location: string;
  barcode: string;
  reorderPoint: number;
  valid: boolean;
  errors: string[];
}

const COLUMN_MAPPINGS: Record<string, keyof ImportRow> = {
  name: 'name',
  item: 'name',
  'item name': 'name',
  description: 'description',
  desc: 'description',
  'product model number': 'modelNumber',
  'model number': 'modelNumber',
  modelnumber: 'modelNumber',
  model: 'modelNumber',
  'vendor part number': 'partNumber',
  'part number': 'partNumber',
  partnumber: 'partNumber',
  'vendor name': 'vendorName',
  vendor: 'vendorName',
  supplier: 'vendorName',
  quantity: 'quantity',
  qty: 'quantity',
  stock: 'quantity',
  'unit value': 'unitValue',
  'unit price': 'unitValue',
  price: 'unitValue',
  cost: 'unitValue',
  'vendor url': 'vendorUrl',
  url: 'vendorUrl',
  link: 'vendorUrl',
  category: 'category',
  cat: 'category',
  type: 'category',
  location: 'location',
  loc: 'location',
  bin: 'location',
  barcode: 'barcode',
  upc: 'barcode',
  sku: 'barcode',
  'reorder point': 'reorderPoint',
  reorderpoint: 'reorderPoint',
  'reorder level': 'reorderPoint',
};

export default function DataImport() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const categories = categoryService.getCategoryNames();

  const validateRow = (row: Partial<ImportRow>): ImportRow => {
    const errors: string[] = [];

    if (!row.name || row.name.trim() === '') {
      errors.push('Name is required');
    }

    const quantity = Number(row.quantity) || 0;
    if (quantity < 0) {
      errors.push('Quantity must be >= 0');
    }

    const unitValue = Number(row.unitValue) || 0;
    if (unitValue < 0) {
      errors.push('Unit value must be >= 0');
    }

    const category = row.category || categories[0] || '';
    if (category && !categories.includes(category)) {
      errors.push(`Invalid category: ${category}`);
    }

    return {
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      modelNumber: String(row.modelNumber || '').trim(),
      partNumber: String(row.partNumber || '').trim(),
      vendorName: String(row.vendorName || '').trim(),
      quantity: Math.max(0, quantity),
      unitValue: Math.max(0, unitValue),
      vendorUrl: String(row.vendorUrl || '').trim(),
      category: categories.includes(category)
        ? category
        : categories[0] || '',
      location: String(row.location || '').trim(),
      barcode: String(row.barcode || '').trim(),
      reorderPoint: Math.max(0, Number(row.reorderPoint) || 0),
      valid: errors.length === 0,
      errors,
    };
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          showError('Error parsing CSV file: ' + results.errors[0].message);
          return;
        }

        const jsonData = results.data as Record<string, unknown>[];

        if (jsonData.length === 0) {
          showError('No data found in file');
          return;
        }

        const mappedData = jsonData.map((row) => {
          const mappedRow: Partial<ImportRow> = {};

          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().trim();
            const mappedField = COLUMN_MAPPINGS[normalizedKey];
            if (mappedField) {
              (mappedRow as Record<string, unknown>)[mappedField] = value;
            }
          });

          return validateRow(mappedRow);
        });

        setImportData(mappedData);
        setFileName(file.name);
      },
      error: () => {
        showError('Failed to parse file. Please ensure it is a valid CSV file.');
      },
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleImport = async () => {
    const validRows = importData.filter((row) => row.valid);

    if (validRows.length === 0) {
      showError('No valid rows to import');
      return;
    }

    setImporting(true);

    try {
      let imported = 0;

      for (const row of validRows) {
        const itemData: ItemFormData = {
          name: row.name,
          description: row.description,
          modelNumber: row.modelNumber,
          partNumber: row.partNumber,
          vendorName: row.vendorName,
          quantity: row.quantity,
          unitValue: row.unitValue,
          picture: null,
          vendorUrl: row.vendorUrl,
          category: row.category,
          location: row.location,
          barcode: row.barcode,
          reorderPoint: row.reorderPoint,
        };

        itemService.createItem(itemData);
        imported++;
      }

      showSuccess(`Successfully imported ${imported} items`);
      navigate('/items');
    } catch {
      showError('Failed to import items');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'name',
      'description',
      'modelNumber',
      'partNumber',
      'vendorName',
      'quantity',
      'unitValue',
      'vendorUrl',
      'category',
      'location',
      'barcode',
      'reorderPoint',
    ];

    const exampleRow = [
      'Example Item',
      'Item description',
      'MODEL-001',
      'VP-001',
      'Vendor Name',
      '10',
      '9.99',
      'https://example.com',
      categories[0] || '',
      'A1B2',
      'RIMS-0001',
      '5',
    ];

    const csv = Papa.unparse({
      fields: headers,
      data: [exampleRow],
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rims-import-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const validCount = importData.filter((row) => row.valid).length;
  const invalidCount = importData.length - validCount;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Import Items</h4>
        <Button variant="outline-secondary" size="sm" onClick={downloadTemplate}>
          <FaDownload className="me-1" /> Download Template
        </Button>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <strong>Supported format:</strong> CSV
          <br />
          <small>
            Columns are auto-detected. Required: name. Optional: description, quantity,
            unitValue, vendorName, partNumber, modelNumber, vendorUrl,
            category, location, barcode, reorderPoint.
          </small>
        </Alert>

        <Form.Group className="mb-4">
          <Form.Label>Select File</Form.Label>
          <Form.Control
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </Form.Group>

        {importData.length > 0 && (
          <>
            <Row className="mb-3">
              <Col>
                <Alert variant={invalidCount > 0 ? 'warning' : 'success'}>
                  <strong>File:</strong> {fileName}
                  <span className="ms-3">
                    <Badge bg="success">{validCount} valid</Badge>
                    {invalidCount > 0 && (
                      <Badge bg="danger" className="ms-2">{invalidCount} invalid</Badge>
                    )}
                  </span>
                </Alert>
              </Col>
            </Row>

            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <Table striped bordered hover size="sm">
                <thead className="sticky-top bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>Status</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Unit Value</th>
                    <th>Location</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, index) => (
                    <tr key={index} className={row.valid ? '' : 'table-danger'}>
                      <td className="text-center">
                        {row.valid ? (
                          <FaCheck className="text-success" />
                        ) : (
                          <FaTimes className="text-danger" />
                        )}
                      </td>
                      <td>{row.name || <em className="text-muted">Missing</em>}</td>
                      <td>{row.category}</td>
                      <td>{row.quantity}</td>
                      <td>${row.unitValue.toFixed(2)}</td>
                      <td>{row.location || '-'}</td>
                      <td>
                        {row.errors.map((err, i) => (
                          <Badge key={i} bg="danger" className="me-1">
                            {err}
                          </Badge>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="mt-4">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="me-2"
              >
                <FaFileUpload className="me-1" />
                {importing ? 'Importing...' : `Import ${validCount} Items`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setImportData([]);
                  setFileName('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Clear
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
