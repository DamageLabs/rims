import { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import * as costHistoryService from '../../services/costHistoryService';
import { CostHistoryEntry, CostStats } from '../../types/CostHistory';

interface CostHistoryChartProps {
  itemId: number;
  currentValue: number;
}

export default function CostHistoryChart({ itemId, currentValue }: CostHistoryChartProps) {
  const [history, setHistory] = useState<CostHistoryEntry[]>([]);
  const [stats, setStats] = useState<CostStats | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [historyData, statsData] = await Promise.all([
          costHistoryService.getCostHistoryForItem(itemId),
          costHistoryService.getCostStats(itemId, currentValue),
        ]);
        setHistory(historyData);
        setStats(statsData);
      } catch {
        // silently handle
      }
    }
    loadData();
  }, [itemId, currentValue]);

  if (history.length === 0 || !stats) {
    return null;
  }

  const getTrendIcon = (trend: CostStats['trend']) => {
    switch (trend) {
      case 'up':
        return <FaArrowUp className="text-danger" />;
      case 'down':
        return <FaArrowDown className="text-success" />;
      default:
        return <FaMinus className="text-secondary" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  // Create chart data points
  const chartPoints = useMemo(() => {
    const points: { date: string; value: number }[] = [];

    // Add initial value from first history entry
    if (history.length > 0) {
      points.push({
        date: history[0].timestamp,
        value: history[0].oldValue,
      });
    }

    // Add all subsequent values
    history.forEach((entry) => {
      points.push({
        date: entry.timestamp,
        value: entry.newValue,
      });
    });

    return points;
  }, [history]);

  // Simple SVG line chart
  const chartWidth = 400;
  const chartHeight = 100;
  const padding = 10;

  const values = chartPoints.map((p) => p.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;

  const getX = (index: number) =>
    padding + (index / (chartPoints.length - 1 || 1)) * (chartWidth - 2 * padding);

  const getY = (value: number) =>
    chartHeight - padding - ((value - minVal) / range) * (chartHeight - 2 * padding);

  const pathD = chartPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point.value)}`)
    .join(' ');

  return (
    <Card className="mt-3">
      <Card.Header>
        <h6 className="mb-0">
          Price History {getTrendIcon(stats.trend)}
        </h6>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col xs={6} md={3} className="text-center">
            <div className="text-muted small">Min</div>
            <strong>{formatCurrency(stats.min)}</strong>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="text-muted small">Max</div>
            <strong>{formatCurrency(stats.max)}</strong>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="text-muted small">Average</div>
            <strong>{formatCurrency(stats.avg)}</strong>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="text-muted small">Changes</div>
            <strong>{stats.changeCount}</strong>
          </Col>
        </Row>

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-100"
          style={{ maxHeight: '150px' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1={padding}
              y1={padding + (1 - pct) * (chartHeight - 2 * padding)}
              x2={chartWidth - padding}
              y2={padding + (1 - pct) * (chartHeight - 2 * padding)}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          ))}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0d6efd"
            strokeWidth={2}
          />

          {/* Points */}
          {chartPoints.map((point, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(point.value)}
              r={4}
              fill="#0d6efd"
            >
              <title>
                {formatDate(point.date)}: {formatCurrency(point.value)}
              </title>
            </circle>
          ))}
        </svg>

        <div className="mt-3">
          <h6>Recent Changes</h6>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {history.slice(-5).reverse().map((entry) => (
              <div
                key={entry.id}
                className="d-flex justify-content-between align-items-center py-1 border-bottom"
              >
                <small className="text-muted">{formatDate(entry.timestamp)}</small>
                <div>
                  <span className="text-muted">{formatCurrency(entry.oldValue)}</span>
                  <span className="mx-2">→</span>
                  <strong>{formatCurrency(entry.newValue)}</strong>
                  <Badge
                    bg={entry.newValue > entry.oldValue ? 'danger' : 'success'}
                    className="ms-2"
                  >
                    {entry.newValue > entry.oldValue ? '+' : ''}
                    {formatCurrency(entry.newValue - entry.oldValue)}
                  </Badge>
                </div>
                <Badge bg="secondary">{entry.source}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
