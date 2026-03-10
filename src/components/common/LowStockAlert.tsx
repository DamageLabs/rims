import { Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Item } from '../../types/Item';
import { LOW_STOCK_THRESHOLD } from '../../constants/config';

interface LowStockAlertProps {
  items: Item[];
  onFilterLowStock: () => void;
  threshold?: number;
  applicableTypeIds?: Set<number>;
}

export default function LowStockAlert({
  items,
  onFilterLowStock,
  threshold = LOW_STOCK_THRESHOLD,
  applicableTypeIds,
}: LowStockAlertProps) {
  const eligibleItems = applicableTypeIds
    ? items.filter((item) => applicableTypeIds.has(item.inventoryTypeId))
    : items;

  const lowStockItems = eligibleItems.filter((item) => item.quantity <= threshold && item.quantity > 0);
  const outOfStockItems = eligibleItems.filter((item) => item.quantity === 0);

  if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
    return null;
  }

  return (
    <Alert variant="warning" className="mb-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <FaExclamationTriangle className="me-2" />
          {outOfStockItems.length > 0 && (
            <span className="me-3">
              <strong>{outOfStockItems.length}</strong> item{outOfStockItems.length !== 1 ? 's' : ''} out of stock
            </span>
          )}
          {lowStockItems.length > 0 && (
            <span>
              <strong>{lowStockItems.length}</strong> item{lowStockItems.length !== 1 ? 's' : ''} low stock (≤{threshold})
            </span>
          )}
        </div>
        <Button variant="warning" size="sm" onClick={onFilterLowStock}>
          View Low Stock
        </Button>
      </div>
    </Alert>
  );
}
