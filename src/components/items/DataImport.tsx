import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Table, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaFileUpload, FaCheck, FaTimes, FaDownload } from 'react-icons/fa';
import Papa from 'papaparse';
import * as itemService from '../../services/itemService';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { ItemFormData } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';

interface ImportRow {
  name: string;
  description: string;
  quantity: number;
  unitValue: number;
  category: string;
  location: string;
  barcode: string;
  reorderPoint: number;
  customFields: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

const COLUMN_MAPPINGS: Record<string, string> = {
  name: 'name',
  item: 'name',
  'item name': 'name',
  description: 'description',
  desc: 'description',
  quantity: 'quantity',
  qty: 'quantity',
  stock: 'quantity',
  'unit value': 'unitValue',
  'unit price': 'unitValue',
  price: 'unitValue',
  cost: 'unitValue',
  category: 'category',
  cat: 'category',
  location: 'location',
  loc: 'location',
  bin: 'location',
  barcode: 'barcode',
  upc: 'barcode',
  sku: 'barcode',
  'reorder point': 'reorderPoint',
  reorderpoint: 'reorderPoint',
  'reorder level': 'reorderPoint',
  // Legacy mappings go to customFields
  'product model number': 'cf:modelNumber',
  'model number': 'cf:modelNumber',
  modelnumber: 'cf:modelNumber',
  model: 'cf:modelNumber',
  'vendor part number': 'cf:partNumber',
  'part number': 'cf:partNumber',
  partnumber: 'cf:partNumber',
  'vendor name': 'cf:vendorName',
  vendor: 'cf:vendorName',
  supplier: 'cf:vendorName',
  'vendor url': 'cf:vendorUrl',
  url: 'cf:vendorUrl',
  link: 'cf:vendorUrl',
};

export default function DataImport() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(1);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);

  useState(() => {
    setInventoryTypes(inventoryTypeService.getAllTypes());
  });

  const categories = categoryService.getCategoryNamesByType(selectedTypeId);

  const validateRow = (row: Partial<ImportRow>): ImportRow => {
    const errors: string[] = [];

    if (!row.name || String(row.name).trim() === '') {
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

    const category = String(row.category || categories[0] || '');
    if (category && categories.length > 0 && !categories.includes(category)) {
      errors.push(`Invalid category: ${category}`);
    }

    return {
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      quantity: Math.max(0, quantity),
      unitValue: Math.max(0, unitValue),
      category: categories.includes(category) ? category : categories[0] || '',
      location: String(row.location || '').trim(),
      barcode: String(row.barcode || '').trim(),
      reorderPoint: Math.max(0, Number(row.reorderPoint) || 0),
      customFields: row.customFields || {},
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
          const customFields: Record<string, unknown> = {};

          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().trim();
            const mappedField = COLUMN_MAPPINGS[normalizedKey];
            if (mappedField) {
              if (mappedField.startsWith('cf:')) {
                customFields[mappedField.slice(3)] = value;
              } else {
                (mappedRow as Record<string, unknown>)[mappedField] = value;
              }
            } else {
              // Unmapped columns go to customFields
              customFields[key] = value;
            }
          });
          mappedRow.customFields = customFields;

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
          quantity: row.quantity,
          unitValue: row.unitValue,
          picture: null,
          category: row.category,
          location: row.location,
          barcode: row.barcode,
          reorderPoint: row.reorderPoint,
          inventoryTypeId: selectedTypeId,
          customFields: row.customFields,
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
    const currentType = inventoryTypes.find((t) => t.id === selectedTypeId);
    const customFieldHeaders = currentType?.schema.map((f) => f.key) || [];
    const headers = [
      'name',
      'description',
      'quantity',
      'unitValue',
      'category',
      'location',
      'barcode',
      'reorderPoint',
      ...customFieldHeaders,
    ];

    const customFieldExamples = currentType?.schema.map((f) => f.placeholder || '') || [];
    const exampleRow = [
      'Example Item',
      'Item description',
      '10',
      '9.99',
      categories[0] || '',
      'A1B2',
      'RIMS-0001',
      '5',
      ...customFieldExamples,
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
            unitValue, category, location, barcode, reorderPoint.
            Type-specific fields (e.g., vendorName, modelNumber) are mapped to custom fields.
          </small>
        </Alert>

        <Row className="mb-4 g-3">
          <Col md={4}>
            <Form.Label>Inventory Type</Form.Label>
            <Form.Select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(parseInt(e.target.value))}
            >
              {inventoryTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={8}>
            <Form.Label>Select File</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </Col>
        </Row>

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
