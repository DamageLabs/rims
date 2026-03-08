import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Button, ButtonGroup, Spinner, Badge } from 'react-bootstrap';
import * as itemService from '../../services/itemService';
import * as vendorService from '../../services/vendorService';
import { Item } from '../../types/Item';
import { VendorPriceResult } from '../../types/Vendor';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import CostHistoryChart from './CostHistoryChart';
import Breadcrumbs from '../common/Breadcrumbs';
import { SkeletonDetailPage } from '../common/Skeleton';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const [item, setItem] = useState<Item | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorPrices, setVendorPrices] = useState<VendorPriceResult[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  useEffect(() => {
    if (id) {
      const foundItem = itemService.getItemById(parseInt(id));
      if (foundItem) {
        setItem(foundItem);
      } else {
        showError('Item not found.');
        navigate('/items');
      }
    }
  }, [id, navigate, showError]);

  const handleDelete = () => {
    if (!item) return;

    const success = itemService.deleteItem(item.id);
    if (success) {
      showSuccess('Item was successfully destroyed.');
      navigate('/items');
    } else {
      showError('Failed to delete item.');
    }
    setShowDeleteModal(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const handleCompareVendorPrices = async () => {
    if (!item?.partNumber) return;

    setIsLoadingPrices(true);
    try {
      const prices = await vendorService.compareVendorPrices(item.partNumber);
      setVendorPrices(prices);
    } catch {
      showError('Failed to fetch vendor prices.');
    } finally {
      setIsLoadingPrices(false);
    }
  };

  if (!item) {
    return <SkeletonDetailPage />;
  }

  const breadcrumbItems = [
    { label: 'Inventory', path: '/items' },
    { label: item.name },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Card>
        <Card.Header>
          <h4 className="mb-0">{item.name}</h4>
        </Card.Header>
      <Card.Body>
        {item.picture && (
          <Row className="mb-4">
            <Col md={12}>
              <img
                src={item.picture}
                alt={item.name}
                style={{ maxWidth: '65%' }}
                className="img-fluid"
              />
            </Col>
          </Row>
        )}

        <Row className="mb-2">
          <Col md={3} className="text-muted">Description</Col>
          <Col md={9}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
          </Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Model Number</Col>
          <Col md={9}>{item.modelNumber}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Vendor Name</Col>
          <Col md={9}>{item.vendorName}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Part Number</Col>
          <Col md={9}>{item.partNumber}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Vendor URL</Col>
          <Col md={9}>
            {item.vendorUrl && (
              <a href={item.vendorUrl} target="_blank" rel="noopener noreferrer">
                {item.vendorUrl}
              </a>
            )}
          </Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Quantity</Col>
          <Col md={9}>{item.quantity}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Unit Value</Col>
          <Col md={9}>{formatCurrency(item.unitValue)}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Total Value</Col>
          <Col md={9}>{formatCurrency(item.value)}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Location</Col>
          <Col md={9}>{item.location}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Category</Col>
          <Col md={9}>{item.category}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Barcode</Col>
          <Col md={9}>{item.barcode || <span className="text-muted">Not set</span>}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Reorder Point</Col>
          <Col md={9}>
            {item.reorderPoint > 0 ? (
              <>
                {item.reorderPoint}
                {item.quantity <= item.reorderPoint && (
                  <span className="badge bg-warning ms-2">Below threshold</span>
                )}
              </>
            ) : (
              <span className="text-muted">Not set</span>
            )}
          </Col>
        </Row>

        {/* Cost History Chart */}
        <CostHistoryChart itemId={item.id} currentValue={item.unitValue} />

        {/* Vendor Price Comparison */}
        {item.partNumber && (
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Vendor Price Comparison</h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleCompareVendorPrices}
                disabled={isLoadingPrices}
              >
                {isLoadingPrices ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-1" />
                    Loading...
                  </>
                ) : (
                  'Compare Prices'
                )}
              </Button>
            </Card.Header>
            {vendorPrices.length > 0 && (
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>vs. Current</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorPrices.map((vp, i) => {
                        const diff = vp.price - item.unitValue;
                        return (
                          <tr key={i}>
                            <td>
                              {vp.vendorUrl ? (
                                <a href={vp.vendorUrl} target="_blank" rel="noopener noreferrer">
                                  {vp.vendor}
                                </a>
                              ) : (
                                vp.vendor
                              )}
                            </td>
                            <td>{formatCurrency(vp.price)}</td>
                            <td>
                              {vp.inStock ? (
                                <Badge bg="success">{vp.stockQuantity} in stock</Badge>
                              ) : (
                                <Badge bg="danger">Out of Stock</Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg={diff < 0 ? 'success' : diff > 0 ? 'danger' : 'secondary'}>
                                {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            )}
          </Card>
        )}

        <hr />

        <ButtonGroup>
          <Link to={`/items/${item.id}/edit`} className="btn btn-primary">
            Edit
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
          <Button variant="secondary" onClick={() => navigate('/items')}>
            Back to List
          </Button>
        </ButtonGroup>
      </Card.Body>

        <ConfirmModal
          show={showDeleteModal}
          title="Delete Item"
          message={`Are you sure you want to delete "${item.name}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </Card>
    </>
  );
}
