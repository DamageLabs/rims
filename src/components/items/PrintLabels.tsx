import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Item } from '../../types/Item';
import { Card, Form, Button, Row, Col, Table, Badge } from 'react-bootstrap';
import { FaPrint, FaBarcode, FaQrcode, FaCheck } from 'react-icons/fa';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import * as itemService from '../../services/itemService';

type LabelType = 'barcode' | 'qrcode';
type LabelSize = 'small' | 'medium' | 'large';

interface LabelConfig {
  type: LabelType;
  size: LabelSize;
  showName: boolean;
  showLocation: boolean;
  showPrice: boolean;
  showQuantity: boolean;
}

const LABEL_SIZES = {
  small: { width: 150, height: 80, barcodeWidth: 1.2, barcodeHeight: 30, qrSize: 50 },
  medium: { width: 200, height: 100, barcodeWidth: 1.5, barcodeHeight: 40, qrSize: 70 },
  large: { width: 280, height: 140, barcodeWidth: 2, barcodeHeight: 60, qrSize: 100 },
};

export default function PrintLabels() {
  const [items, setItems] = useState<Item[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadItems() {
      try {
        const allItems = await itemService.getAllItems();
        setItems(allItems);
      } catch {
        // silently handle
      }
    }
    loadItems();
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [config, setConfig] = useState<LabelConfig>({
    type: 'barcode',
    size: 'medium',
    showName: true,
    showLocation: true,
    showPrice: false,
    showQuantity: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedLabels, setGeneratedLabels] = useState<Map<number, string>>(new Map());

  const filteredItems = useMemo(() => items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const selectedItems = useMemo(() =>
    items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // Stable string key for selected IDs
  const selectedIdsKey = useMemo(() =>
    Array.from(selectedIds).sort().join(','),
    [selectedIds]
  );

  const generateLabels = useCallback(async () => {
    if (selectedItems.length === 0) {
      setGeneratedLabels(new Map());
      return;
    }

    const labels = new Map<number, string>();
    const sizeConfig = LABEL_SIZES[config.size];

    for (const item of selectedItems) {
      const barcodeValue = item.barcode || `RIMS-${String(item.id).padStart(4, '0')}`;

      if (config.type === 'barcode') {
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, barcodeValue, {
            format: 'CODE128',
            width: sizeConfig.barcodeWidth,
            height: sizeConfig.barcodeHeight,
            displayValue: true,
            fontSize: 12,
            margin: 5,
          });
          labels.set(item.id, canvas.toDataURL());
        } catch {
          labels.set(item.id, '');
        }
      } else {
        try {
          const dataUrl = await QRCode.toDataURL(barcodeValue, {
            width: sizeConfig.qrSize,
            margin: 1,
          });
          labels.set(item.id, dataUrl);
        } catch (err) {
          console.error('QR code generation failed:', err);
          labels.set(item.id, '');
        }
      }
    }

    setGeneratedLabels(labels);
  }, [selectedItems, config.type, config.size]);

  useEffect(() => {
    generateLabels();
  }, [selectedIdsKey, config.type, config.size]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sizeConfig = LABEL_SIZES[config.size];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels - RIMS</title>
          <style>
            @media print {
              @page {
                margin: 0.5cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .label {
              width: ${sizeConfig.width}px;
              height: ${sizeConfig.height}px;
              border: 1px solid #ccc;
              padding: 5px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
            }
            .label img {
              max-width: 100%;
              max-height: ${config.type === 'barcode' ? sizeConfig.barcodeHeight + 20 : sizeConfig.qrSize}px;
            }
            .label-name {
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 100%;
            }
            .label-info {
              font-size: 8px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${printRef.current.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const sizeConfig = LABEL_SIZES[config.size];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FaBarcode className="me-2" />
          Print Labels
        </h4>
        {selectedIds.size > 0 && (
          <Button variant="primary" onClick={handlePrint}>
            <FaPrint className="me-2" />
            Print {selectedIds.size} Label{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h6 className="mb-0">Label Settings</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Label Type</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    id="type-barcode"
                    label={<><FaBarcode className="me-1" /> Barcode</>}
                    checked={config.type === 'barcode'}
                    onChange={() => setConfig((c) => ({ ...c, type: 'barcode' }))}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id="type-qrcode"
                    label={<><FaQrcode className="me-1" /> QR Code</>}
                    checked={config.type === 'qrcode'}
                    onChange={() => setConfig((c) => ({ ...c, type: 'qrcode' }))}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Label Size</Form.Label>
                <Form.Select
                  value={config.size}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, size: e.target.value as LabelSize }))
                  }
                >
                  <option value="small">Small (1.5" x 0.8")</option>
                  <option value="medium">Medium (2" x 1")</option>
                  <option value="large">Large (2.8" x 1.4")</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Include on Label</Form.Label>
                <Form.Check
                  type="checkbox"
                  label="Item Name"
                  checked={config.showName}
                  onChange={(e) => setConfig((c) => ({ ...c, showName: e.target.checked }))}
                />
                <Form.Check
                  type="checkbox"
                  label="Location"
                  checked={config.showLocation}
                  onChange={(e) => setConfig((c) => ({ ...c, showLocation: e.target.checked }))}
                />
                <Form.Check
                  type="checkbox"
                  label="Unit Price"
                  checked={config.showPrice}
                  onChange={(e) => setConfig((c) => ({ ...c, showPrice: e.target.checked }))}
                />
                <Form.Check
                  type="checkbox"
                  label="Quantity"
                  checked={config.showQuantity}
                  onChange={(e) => setConfig((c) => ({ ...c, showQuantity: e.target.checked }))}
                />
              </Form.Group>
            </Card.Body>
          </Card>

          {selectedItems.length > 0 && (
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">Preview</h6>
              </Card.Header>
              <Card.Body className="d-flex flex-wrap gap-2 justify-content-center">
                {selectedItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: sizeConfig.width,
                      height: sizeConfig.height,
                      border: '1px solid #ccc',
                      padding: '5px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {config.showName && (
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {item.name}
                      </div>
                    )}
                    {generatedLabels.get(item.id) && (
                      <img
                        src={generatedLabels.get(item.id)}
                        alt="barcode"
                        style={{ maxWidth: '100%' }}
                      />
                    )}
                    {(config.showLocation || config.showPrice || config.showQuantity) && (
                      <div style={{ fontSize: '8px', color: '#666', textAlign: 'center' }}>
                        {[
                          config.showLocation && item.location,
                          config.showPrice && `$${item.unitValue.toFixed(2)}`,
                          config.showQuantity && `Qty: ${item.quantity}`,
                        ]
                          .filter(Boolean)
                          .join(' | ')}
                      </div>
                    )}
                  </div>
                ))}
                {selectedItems.length > 2 && (
                  <div className="text-muted small align-self-center">
                    +{selectedItems.length - 2} more
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Select Items</h6>
                <div>
                  <Button variant="link" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="link" size="sm" onClick={selectNone}>
                    Select None
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-2 border-bottom">
                <Form.Control
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                <Table hover className="mb-0">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        style={{ cursor: 'pointer' }}
                        className={selectedIds.has(item.id) ? 'table-primary' : ''}
                      >
                        <td className="text-center">
                          {selectedIds.has(item.id) && (
                            <FaCheck className="text-primary" />
                          )}
                        </td>
                        <td>{item.name}</td>
                        <td>
                          {item.barcode ? (
                            <code>{item.barcode}</code>
                          ) : (
                            <Badge bg="secondary">Auto-generate</Badge>
                          )}
                        </td>
                        <td>{item.location || '-'}</td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hidden print container */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {selectedItems.map((item) => (
            <div key={item.id} className="label">
              {config.showName && <div className="label-name">{item.name}</div>}
              {generatedLabels.get(item.id) && (
                <img src={generatedLabels.get(item.id)} alt="barcode" />
              )}
              {(config.showLocation || config.showPrice || config.showQuantity) && (
                <div className="label-info">
                  {[
                    config.showLocation && item.location,
                    config.showPrice && `$${item.unitValue.toFixed(2)}`,
                    config.showQuantity && `Qty: ${item.quantity}`,
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
