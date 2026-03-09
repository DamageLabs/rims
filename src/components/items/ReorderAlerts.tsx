import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaShoppingCart, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import { Item } from '../../types/Item';
import { formatCurrency } from '../../utils/formatters';

type SortField = 'name' | 'quantity' | 'reorderPoint' | 'deficit' | 'category' | 'vendor';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortHeader({ field, sortField, sortDirection, onSort, children }: SortHeaderProps) {
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      className={sortField === field ? 'table-active' : ''}
    >
      {children}
      {sortField === field && (
        <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );
}

export default function ReorderAlerts() {
  const items = itemService.getAllItems();
  const [sortField, setSortField] = useState<SortField>('deficit');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<number>>(new Set());

  const itemsNeedingReorder = useMemo(() => {
    return items.filter(
      (item) => item.reorderPoint > 0 && item.quantity <= item.reorderPoint
    );
  }, [items]);

  const categories = useMemo(() => {
    const cats = new Set(itemsNeedingReorder.map((item) => item.category));
    return Array.from(cats).sort();
  }, [itemsNeedingReorder]);

  const vendors = useMemo(() => {
    const vends = new Set(itemsNeedingReorder.map((item) => (item.customFields?.vendorName as string || '')).filter(Boolean));
    return Array.from(vends).sort();
  }, [itemsNeedingReorder]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...itemsNeedingReorder];

    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (vendorFilter) {
      filtered = filtered.filter((item) => (item.customFields?.vendorName as string || '') === vendorFilter);
    }

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'reorderPoint':
          aVal = a.reorderPoint;
          bVal = b.reorderPoint;
          break;
        case 'deficit':
          aVal = a.reorderPoint - a.quantity;
          bVal = b.reorderPoint - b.quantity;
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
        case 'vendor':
          aVal = ((a.customFields?.vendorName as string) || '').toLowerCase();
          bVal = ((b.customFields?.vendorName as string) || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [itemsNeedingReorder, categoryFilter, vendorFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleAcknowledge = (id: number) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getDeficitBadge = (item: Item) => {
    const deficit = item.reorderPoint - item.quantity;
    if (item.quantity === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    }
    if (deficit > item.reorderPoint / 2) {
      return <Badge bg="warning">Low</Badge>;
    }
    return <Badge bg="info">Reorder</Badge>;
  };

  const unacknowledgedCount = filteredAndSortedItems.filter(
    (item) => !acknowledgedIds.has(item.id)
  ).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FaExclamationTriangle className="me-2 text-warning" />
          Reorder Alerts
          {unacknowledgedCount > 0 && (
            <Badge bg="danger" className="ms-2">{unacknowledgedCount}</Badge>
          )}
        </h4>
      </div>

      {itemsNeedingReorder.length === 0 ? (
        <Alert variant="success">
          <FaCheck className="me-2" />
          All items are above their reorder points. No action needed.
        </Alert>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Category</Form.Label>
                    <Form.Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Vendor</Form.Label>
                    <Form.Select
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter(e.target.value)}
                    >
                      <option value="">All Vendors</option>
                      {vendors.map((vendor) => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <div>
                    <Badge bg="danger" className="me-2">
                      {filteredAndSortedItems.filter((i) => i.quantity === 0).length} Out of Stock
                    </Badge>
                    <Badge bg="warning">
                      {filteredAndSortedItems.filter((i) => i.quantity > 0).length} Low Stock
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <SortHeader field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Item</SortHeader>
                    <SortHeader field="category" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Category</SortHeader>
                    <SortHeader field="vendor" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Vendor</SortHeader>
                    <SortHeader field="quantity" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Current Qty</SortHeader>
                    <SortHeader field="reorderPoint" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Reorder Point</SortHeader>
                    <SortHeader field="deficit" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Deficit</SortHeader>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedItems.map((item) => {
                    const deficit = item.reorderPoint - item.quantity;
                    const isAcknowledged = acknowledgedIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={isAcknowledged ? 'table-secondary' : item.quantity === 0 ? 'table-danger' : ''}
                      >
                        <td className="text-center">
                          <Form.Check
                            type="checkbox"
                            checked={isAcknowledged}
                            onChange={() => toggleAcknowledge(item.id)}
                            title="Mark as acknowledged"
                          />
                        </td>
                        <td>
                          <Link to={`/items/${item.id}`}>{item.name}</Link>
                          <br />
                          <small className="text-muted">{item.location || 'No location'}</small>
                        </td>
                        <td>{item.category}</td>
                        <td>{(item.customFields?.vendorName as string || '') || '-'}</td>
                        <td>
                          <strong className={item.quantity === 0 ? 'text-danger' : ''}>
                            {item.quantity}
                          </strong>
                        </td>
                        <td>{item.reorderPoint}</td>
                        <td>
                          <strong className="text-danger">-{deficit}</strong>
                        </td>
                        <td>{getDeficitBadge(item)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link
                              to={`/items/${item.id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit item"
                            >
                              <FaShoppingCart />
                            </Link>
                            {(item.customFields?.vendorUrl as string) && (
                              <a
                                href={(item.customFields?.vendorUrl as string)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-secondary"
                                title="Open vendor page"
                              >
                                <FaExternalLinkAlt />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        No items match the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">Reorder Summary by Vendor</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Items to Reorder</th>
                    <th>Estimated Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => {
                    const vendorItems = itemsNeedingReorder.filter(
                      (item) => (item.customFields?.vendorName as string || '') === vendor
                    );
                    const estimatedCost = vendorItems.reduce(
                      (sum, item) => sum + (item.reorderPoint - item.quantity) * item.unitValue,
                      0
                    );
                    const vendorUrl = vendorItems.find((i) => i.customFields?.vendorUrl)?.customFields?.vendorUrl as string;

                    return (
                      <tr key={vendor}>
                        <td>{vendor}</td>
                        <td>{vendorItems.length} items</td>
                        <td>{formatCurrency(estimatedCost)}</td>
                        <td>
                          {vendorUrl && (
                            <a
                              href={vendorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FaExternalLinkAlt className="me-1" />
                              Visit Vendor
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
