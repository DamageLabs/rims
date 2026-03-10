import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table } from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaBox, FaDollarSign, FaExclamationTriangle, FaHistory } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import * as stockHistoryService from '../../services/stockHistoryService';
import { formatCurrency } from '../../utils/formatters';
import { LOW_STOCK_THRESHOLD, LOW_STOCK_TYPE_NAMES } from '../../constants/config';
import { InventoryType } from '../../types/InventoryType';
import { useTheme } from '../../contexts/ThemeContext';
import { Item } from '../../types/Item';
import { StockHistoryEntry } from '../../types/StockHistory';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: string;
  link?: string;
}

function StatCard({ title, value, icon, variant, link }: StatCardProps) {
  const content = (
    <Card className={`border-${variant} h-100`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="mb-0">{value}</h3>
          </div>
          <div className={`text-${variant}`} style={{ fontSize: '2rem', opacity: 0.7 }}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (link) {
    return <Link to={link} className="text-decoration-none">{content}</Link>;
  }
  return content;
}

export default function Dashboard() {
  const { isDark } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [recentHistory, setRecentHistory] = useState<StockHistoryEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [loadedItems, loadedTypes, loadedHistory] = await Promise.all([
        itemService.getAllItems(),
        inventoryTypeService.getAllTypes(),
        stockHistoryService.getRecentHistory(10),
      ]);
      setItems(loadedItems);
      setInventoryTypes(loadedTypes);
      setRecentHistory(loadedHistory);
    };
    loadData();
  }, []);

  const lowStockTypeIds = useMemo(() => {
    return new Set(
      inventoryTypes
        .filter((t) => LOW_STOCK_TYPE_NAMES.includes(t.name))
        .map((t) => t.id)
    );
  }, [inventoryTypes]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const stockEligible = items.filter((item) => lowStockTypeIds.has(item.inventoryTypeId));
    const lowStockCount = stockEligible.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD && item.quantity > 0).length;
    const outOfStockCount = stockEligible.filter((item) => item.quantity === 0).length;

    return { totalItems, totalQuantity, totalValue, lowStockCount, outOfStockCount };
  }, [items, lowStockTypeIds]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { count: number; value: number; quantity: number }>();

    items.forEach((item) => {
      const existing = categoryMap.get(item.category) || { count: 0, value: 0, quantity: 0 };
      categoryMap.set(item.category, {
        count: existing.count + 1,
        value: existing.value + item.value,
        quantity: existing.quantity + item.quantity,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const locationData = useMemo(() => {
    const locationMap = new Map<string, { count: number; value: number }>();

    items.forEach((item) => {
      const location = item.location || 'Unassigned';
      const existing = locationMap.get(location) || { count: 0, value: 0 };
      locationMap.set(location, {
        count: existing.count + 1,
        value: existing.value + item.value,
      });
    });

    return Array.from(locationMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [items]);

  const topItemsByValue = useMemo(() => {
    return [...items].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [items]);

  const textColor = isDark ? '#e9ecef' : '#212529';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Dashboard</h4>
        <div className="text-muted">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<FaBox />}
            variant="primary"
            link="/items"
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={<FaDollarSign />}
            variant="success"
            link="/reports/valuation"
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockCount + stats.outOfStockCount}
            icon={<FaExclamationTriangle />}
            variant="warning"
            link="/items"
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Total Quantity"
            value={stats.totalQuantity.toLocaleString()}
            icon={<FaHistory />}
            variant="info"
            link="/reports/movement"
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">Value by Category</h6>
            </Card.Header>
            <Card.Body>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: isDark ? '#212529' : '#fff',
                        border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                        color: textColor,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">No data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">Value by Location (Top 10)</h6>
            </Card.Header>
            <Card.Body>
              {locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#495057' : '#dee2e6'} />
                    <XAxis type="number" tickFormatter={(v) => formatAxisValue(v)} stroke={textColor} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: textColor }} stroke={textColor} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: isDark ? '#212529' : '#fff',
                        border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                        color: textColor,
                      }}
                    />
                    <Bar dataKey="value" fill="#0d6efd" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">No data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row className="g-3">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Top Items by Value</h6>
              <Link to="/reports/valuation" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topItemsByValue.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/items/${item.id}`}>{item.name}</Link>
                      </td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                  {topItemsByValue.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-3">No items</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Activity</h6>
              <Link to="/reports/movement" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Action</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.itemName}</td>
                      <td>
                        <span className={`badge bg-${getChangeTypeBadge(entry.changeType)}`}>
                          {formatChangeType(entry.changeType)}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {formatRelativeTime(entry.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {recentHistory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-3">No recent activity</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function getChangeTypeBadge(type: string): string {
  switch (type) {
    case 'created': return 'success';
    case 'updated': return 'primary';
    case 'deleted': return 'danger';
    case 'adjusted': return 'info';
    case 'category_changed': return 'secondary';
    default: return 'secondary';
  }
}

function formatChangeType(type: string): string {
  switch (type) {
    case 'created': return 'Created';
    case 'updated': return 'Updated';
    case 'deleted': return 'Deleted';
    case 'adjusted': return 'Adjusted';
    case 'category_changed': return 'Category';
    default: return type;
  }
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatAxisValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}
