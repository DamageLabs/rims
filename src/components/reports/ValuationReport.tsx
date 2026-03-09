import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Row, Col, Form, Button, ButtonGroup, Collapse } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight, FaFileExcel } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import * as itemService from '../../services/itemService';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';

type GroupBy = 'category' | 'location' | 'vendor';

interface GroupedData {
  name: string;
  items: typeof items;
  totalQuantity: number;
  totalValue: number;
  itemCount: number;
}

const items = itemService.getAllItems();

export default function ValuationReport() {
  const { isDark } = useTheme();
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showChart, setShowChart] = useState(true);

  const allItems = itemService.getAllItems();

  const groupedData = useMemo(() => {
    const groups = new Map<string, typeof allItems>();

    allItems.forEach((item) => {
      let key: string;
      switch (groupBy) {
        case 'category':
          key = item.category || 'Uncategorized';
          break;
        case 'location':
          key = item.location || 'Unassigned';
          break;
        case 'vendor':
          key = (item.customFields?.vendorName as string) || 'Unknown Vendor';
          break;
        default:
          key = 'All';
      }

      const existing = groups.get(key) || [];
      groups.set(key, [...existing, item]);
    });

    const result: GroupedData[] = Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => sum + item.value, 0),
      itemCount: items.length,
    }));

    return result.sort((a, b) => b.totalValue - a.totalValue);
  }, [allItems, groupBy]);

  const totals = useMemo(() => {
    return {
      items: allItems.length,
      quantity: allItems.reduce((sum, item) => sum + item.quantity, 0),
      value: allItems.reduce((sum, item) => sum + item.value, 0),
    };
  }, [allItems]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groupedData.map((g) => g.name)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const exportToCSV = () => {
    const headers = ['Group', 'Item Name', 'Model #', 'Quantity', 'Unit Value', 'Total Value', 'Location', 'Category'];
    const rows: string[][] = [];

    groupedData.forEach((group) => {
      group.items.forEach((item) => {
        rows.push([
          group.name,
          item.name,
          (item.customFields?.modelNumber as string || ''),
          item.quantity.toString(),
          item.unitValue.toFixed(2),
          item.value.toFixed(2),
          item.location,
          item.category,
        ]);
      });
      // Add subtotal row
      rows.push([
        `${group.name} Subtotal`,
        '',
        '',
        group.totalQuantity.toString(),
        '',
        group.totalValue.toFixed(2),
        '',
        '',
      ]);
    });

    // Add grand total
    rows.push(['Grand Total', '', '', totals.quantity.toString(), '', totals.value.toFixed(2), '', '']);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const textColor = isDark ? '#e9ecef' : '#212529';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Inventory Valuation Report</h4>
          <p className="text-muted mb-0">Total value by {groupBy}</p>
        </div>
        <ButtonGroup size="sm">
          <Button variant="outline-success" onClick={exportToCSV}>
            <FaFileExcel className="me-1" /> Export CSV
          </Button>
        </ButtonGroup>
      </div>

      {/* Controls */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">Group By</Form.Label>
                <Form.Select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                >
                  <option value="category">Category</option>
                  <option value="location">Location</option>
                  <option value="vendor">Vendor</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">View Options</Form.Label>
                <div>
                  <Form.Check
                    type="switch"
                    id="show-chart"
                    label="Show Chart"
                    checked={showChart}
                    onChange={(e) => setShowChart(e.target.checked)}
                    inline
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={4} className="text-md-end">
              <ButtonGroup size="sm">
                <Button variant="outline-secondary" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline-secondary" onClick={collapseAll}>
                  Collapse All
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Chart */}
      {showChart && (
        <Card className="mb-4">
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupedData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#495057' : '#dee2e6'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: textColor, fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke={textColor}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: textColor }}
                  stroke={textColor}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: isDark ? '#212529' : '#fff',
                    border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                    color: textColor,
                  }}
                />
                <Bar dataKey="totalValue" fill="#0d6efd" name="Total Value" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Groups</h6>
              <h3>{groupedData.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Items</h6>
              <h3>{totals.items.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-success">
            <Card.Body>
              <h6 className="text-muted">Total Value</h6>
              <h3 className="text-success">{formatCurrency(totals.value)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Grouped Tables */}
      {groupedData.map((group) => (
        <Card key={group.name} className="mb-3">
          <Card.Header
            onClick={() => toggleGroup(group.name)}
            style={{ cursor: 'pointer' }}
            className="d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center">
              {expandedGroups.has(group.name) ? (
                <FaChevronDown className="me-2" />
              ) : (
                <FaChevronRight className="me-2" />
              )}
              <span className="fw-bold">{group.name}</span>
              <span className="badge bg-secondary ms-2">{group.itemCount} items</span>
            </div>
            <div>
              <span className="me-3">Qty: {group.totalQuantity.toLocaleString()}</span>
              <span className="fw-bold text-success">{formatCurrency(group.totalValue)}</span>
              <span className="text-muted ms-2">
                ({((group.totalValue / totals.value) * 100).toFixed(1)}%)
              </span>
            </div>
          </Card.Header>
          <Collapse in={expandedGroups.has(group.name)}>
            <div>
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Model #</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Unit Value</th>
                    <th className="text-end">Total Value</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/items/${item.id}`}>{item.name}</Link>
                      </td>
                      <td>{(item.customFields?.modelNumber as string || '')}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">{formatCurrency(item.unitValue)}</td>
                      <td className="text-end">{formatCurrency(item.value)}</td>
                      <td>{item.location}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary">
                  <tr>
                    <td colSpan={2}><strong>Subtotal</strong></td>
                    <td className="text-end"><strong>{group.totalQuantity}</strong></td>
                    <td></td>
                    <td className="text-end"><strong>{formatCurrency(group.totalValue)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Collapse>
        </Card>
      ))}

      {/* Grand Total */}
      <Card className="border-success">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Grand Total</h5>
          <div>
            <span className="me-4">
              <strong>{totals.items}</strong> items
            </span>
            <span className="me-4">
              <strong>{totals.quantity.toLocaleString()}</strong> units
            </span>
            <span className="fs-4 fw-bold text-success">
              {formatCurrency(totals.value)}
            </span>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
