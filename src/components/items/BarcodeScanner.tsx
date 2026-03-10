import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, ListGroup, Badge } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaStop, FaSearch, FaPlus, FaMinus, FaBarcode } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import { Item } from '../../types/Item';
import { useAlert } from '../../contexts/AlertContext';
import { formatCurrency } from '../../utils/formatters';

export default function BarcodeScanner() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [foundItem, setFoundItem] = useState<Item | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentScans, setRecentScans] = useState<{ barcode: string; item: Item | null; time: Date }[]>([]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          handleBarcodeFound(decodedText);
        },
        () => {}
      );

      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      showError('Failed to access camera. Please check permissions or use manual entry.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Ignore stop errors
      }
    }
    setScanning(false);
  };

  const handleBarcodeFound = (barcode: string) => {
    if (barcode === lastScanned) return;

    setLastScanned(barcode);
    lookupBarcode(barcode);
  };

  const lookupBarcode = async (barcode: string) => {
    try {
      const items = await itemService.getAllItems();
      const item = items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());

      setFoundItem(item || null);
      setRecentScans((prev) => [
        { barcode, item: item || null, time: new Date() },
        ...prev.slice(0, 9),
      ]);

      if (item) {
        showSuccess(`Found: ${item.name}`);
      }
    } catch {
      showError('Failed to look up barcode.');
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      lookupBarcode(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const adjustQuantity = async (item: Item, delta: number) => {
    try {
      const newQuantity = Math.max(0, item.quantity + delta);
      const updated = await itemService.updateItem(item.id, { quantity: newQuantity });
      if (updated) {
        setFoundItem(updated);
        showSuccess(`Quantity updated to ${newQuantity}`);
        setRecentScans((prev) =>
          prev.map((scan) =>
            scan.item?.id === item.id ? { ...scan, item: updated } : scan
          )
        );
      }
    } catch {
      showError('Failed to update quantity.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FaBarcode className="me-2" />
          Barcode Scanner
        </h4>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <Card>
            <Card.Header>
              <h6 className="mb-0">Camera Scanner</h6>
            </Card.Header>
            <Card.Body>
              <div
                id="barcode-reader"
                style={{
                  width: '100%',
                  minHeight: scanning ? '300px' : '0',
                  marginBottom: scanning ? '1rem' : '0',
                }}
              />

              {!scanning ? (
                <Button variant="primary" onClick={startScanning} className="w-100">
                  <FaCamera className="me-2" />
                  Start Camera
                </Button>
              ) : (
                <Button variant="danger" onClick={stopScanning} className="w-100">
                  <FaStop className="me-2" />
                  Stop Camera
                </Button>
              )}

              <hr />

              <Form onSubmit={handleManualLookup}>
                <Form.Label>Manual Entry</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter barcode..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <FaSearch />
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {foundItem && (
            <Card className="mt-3">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">Item Found</h6>
              </Card.Header>
              <Card.Body>
                <h5>{foundItem.name}</h5>
                <p className="text-muted mb-2">{foundItem.description}</p>
                <div className="mb-3">
                  <Badge bg="secondary" className="me-2">{foundItem.category}</Badge>
                  <Badge bg="info">{foundItem.location || 'No location'}</Badge>
                </div>
                <table className="table table-sm mb-3">
                  <tbody>
                    <tr>
                      <td>Barcode:</td>
                      <td><code>{foundItem.barcode}</code></td>
                    </tr>
                    <tr>
                      <td>Quantity:</td>
                      <td>
                        <strong>{foundItem.quantity}</strong>
                        {foundItem.reorderPoint > 0 && foundItem.quantity <= foundItem.reorderPoint && (
                          <Badge bg="warning" className="ms-2">Low Stock</Badge>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Unit Value:</td>
                      <td>{formatCurrency(foundItem.unitValue)}</td>
                    </tr>
                    <tr>
                      <td>Total Value:</td>
                      <td>{formatCurrency(foundItem.value)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant="outline-danger"
                    onClick={() => adjustQuantity(foundItem, -1)}
                    disabled={foundItem.quantity === 0}
                  >
                    <FaMinus />
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={() => adjustQuantity(foundItem, 1)}
                  >
                    <FaPlus />
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/items/${foundItem.id}`)}
                    className="flex-grow-1"
                  >
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {lastScanned && !foundItem && (
            <Alert variant="warning" className="mt-3">
              <strong>Barcode not found:</strong> <code>{lastScanned}</code>
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`/items/new?barcode=${encodeURIComponent(lastScanned)}`)}
                >
                  Create New Item with this Barcode
                </Button>
              </div>
            </Alert>
          )}
        </div>

        <div className="col-lg-6">
          <Card>
            <Card.Header>
              <h6 className="mb-0">Recent Scans</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {recentScans.length > 0 ? (
                <ListGroup variant="flush">
                  {recentScans.map((scan, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <code>{scan.barcode}</code>
                        <br />
                        <small className="text-muted">
                          {scan.time.toLocaleTimeString()}
                        </small>
                      </div>
                      {scan.item ? (
                        <div className="text-end">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setFoundItem(scan.item);
                              setLastScanned(scan.barcode);
                            }}
                          >
                            {scan.item.name}
                          </Button>
                          <br />
                          <small>Qty: {scan.item.quantity}</small>
                        </div>
                      ) : (
                        <Badge bg="secondary">Not found</Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="p-4 text-center text-muted">
                  No scans yet. Start scanning or enter a barcode manually.
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
