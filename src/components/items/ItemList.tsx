import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, ButtonGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaFileExcel, FaFilePdf, FaBoxOpen } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';
import Pagination from '../common/Pagination';
import ConfirmModal from '../common/ConfirmModal';
import ItemFilters from './ItemFilters';
import BulkActions from './BulkActions';
import LowStockAlert from '../common/LowStockAlert';
import EmptyState from '../common/EmptyState';
import { exportToCSV, exportToPDF } from '../../utils/export';
import { formatCurrency } from '../../utils/formatters';
import { ITEMS_PER_PAGE, LOW_STOCK_THRESHOLD } from '../../constants/config';

type SortField = 'name' | 'quantity' | 'unitValue' | 'value' | 'location' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortHeader({ field, currentField, direction, onSort, children }: SortHeaderProps) {
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer' }}
      className="text-center"
    >
      {children}
      {currentField === field && (direction === 'asc' ? ' ▲' : ' ▼')}
    </th>
  );
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalItem, setDeleteModalItem] = useState<Item | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string>('');
  const { showSuccess, showError } = useAlert();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [typeFilter, setTypeFilter] = useState('');

  const loadItems = useCallback(() => {
    const allItems = itemService.getAllItems();
    setItems(allItems);
  }, []);

  useEffect(() => {
    setInventoryTypes(inventoryTypeService.getAllTypes());
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page and selection when filters change
  const resetFiltersState = useCallback(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    resetFiltersState();
  }, [resetFiltersState]);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    resetFiltersState();
  }, [resetFiltersState]);

  const handleLowStockToggle = useCallback((value: boolean) => {
    setShowLowStockOnly(value);
    resetFiltersState();
  }, [resetFiltersState]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const customFieldValues = Object.values(item.customFields || {}).map((v) => String(v || '').toLowerCase());
        const matchesSearch =
          item.name.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search) ||
          customFieldValues.some((v) => v.includes(search));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter && item.inventoryTypeId !== parseInt(typeFilter)) {
        return false;
      }

      // Category filter
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      // Low stock filter
      if (showLowStockOnly && item.quantity > LOW_STOCK_THRESHOLD) {
        return false;
      }

      return true;
    });
  }, [items, searchTerm, typeFilter, categoryFilter, showLowStockOnly]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortDirection]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredItems.reduce((sum, item) => sum + item.value, 0);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleDelete = () => {
    if (!deleteModalItem) return;

    const success = itemService.deleteItem(deleteModalItem.id);
    if (success) {
      showSuccess('Item was successfully destroyed.');
      loadItems();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteModalItem.id);
        return next;
      });
    } else {
      showError('Failed to delete item.');
    }
    setDeleteModalItem(null);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    const deletedCount = itemService.deleteItems(ids);
    if (deletedCount > 0) {
      showSuccess(`${deletedCount} item${deletedCount !== 1 ? 's' : ''} deleted successfully.`);
      loadItems();
      setSelectedIds(new Set());
    } else {
      showError('Failed to delete items.');
    }
    setShowBulkDeleteModal(false);
  };

  const handleBulkCategoryChange = (category: string) => {
    setPendingCategory(category);
    setShowBulkCategoryModal(true);
  };

  const confirmBulkCategoryChange = () => {
    const ids = Array.from(selectedIds);
    const updatedCount = itemService.updateItemsCategory(ids, pendingCategory);
    if (updatedCount > 0) {
      showSuccess(`${updatedCount} item${updatedCount !== 1 ? 's' : ''} updated to category "${pendingCategory}".`);
      loadItems();
      setSelectedIds(new Set());
    } else {
      showError('Failed to update items.');
    }
    setShowBulkCategoryModal(false);
    setPendingCategory('');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedItems.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
    setShowLowStockOnly(false);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleFilterLowStock = () => {
    handleLowStockToggle(true);
  };

  const allPageItemsSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.has(item.id));
  const somePageItemsSelected = paginatedItems.some((item) => selectedIds.has(item.id));

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Inventory Items</h4>
          <div className="d-flex gap-2 flex-wrap">
            <ButtonGroup size="sm">
              <Button variant="outline-success" onClick={() => exportToCSV(filteredItems)}>
                <FaFileExcel className="me-1" />
                CSV
              </Button>
              <Button variant="outline-danger" onClick={() => exportToPDF(filteredItems)}>
                <FaFilePdf className="me-1" />
                PDF
              </Button>
            </ButtonGroup>
            <Link to="/items/new" className="btn btn-primary">
              New Item
            </Link>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <LowStockAlert
          items={items}
          onFilterLowStock={handleFilterLowStock}
          threshold={LOW_STOCK_THRESHOLD}
        />

        <ItemFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          categoryFilter={categoryFilter}
          onCategoryChange={handleCategoryChange}
          typeFilter={typeFilter}
          onTypeChange={(v) => { setTypeFilter(v); resetFiltersState(); }}
          onReset={handleResetFilters}
        />

        {showLowStockOnly && (
          <div className="mb-3">
            <span className="badge bg-warning text-dark me-2">Showing low stock items only</span>
            <Button variant="link" size="sm" onClick={() => handleLowStockToggle(false)}>
              Clear
            </Button>
          </div>
        )}

        <BulkActions
          selectedCount={selectedIds.size}
          onDelete={() => setShowBulkDeleteModal(true)}
          onCategoryChange={handleBulkCategoryChange}
        />

        <Table hover responsive>
          <thead>
            <tr>
              <th className="text-center" style={{ width: '40px' }}>
                <Form.Check
                  type="checkbox"
                  checked={allPageItemsSelected}
                  ref={(el: HTMLInputElement | null) => {
                    if (el) {
                      el.indeterminate = somePageItemsSelected && !allPageItemsSelected;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all items on page"
                />
              </th>
              <SortHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Item Name</SortHeader>
              <th className="text-center">Type</th>
              <SortHeader field="quantity" currentField={sortField} direction={sortDirection} onSort={handleSort}>Quantity</SortHeader>
              <SortHeader field="unitValue" currentField={sortField} direction={sortDirection} onSort={handleSort}>Unit Value</SortHeader>
              <SortHeader field="value" currentField={sortField} direction={sortDirection} onSort={handleSort}>Total Value</SortHeader>
              <SortHeader field="location" currentField={sortField} direction={sortDirection} onSort={handleSort}>Location</SortHeader>
              <SortHeader field="category" currentField={sortField} direction={sortDirection} onSort={handleSort}>Category</SortHeader>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className={selectedIds.has(item.id) ? 'table-active' : ''}>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    aria-label={`Select ${item.name}`}
                  />
                </td>
                <td>
                  <Link to={`/items/${item.id}`}>{item.name}</Link>
                </td>
                <td className="text-center">
                  <small>{inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name || '-'}</small>
                </td>
                <td className={`text-center ${item.quantity === 0 ? 'text-danger fw-bold' : item.quantity <= LOW_STOCK_THRESHOLD ? 'text-warning fw-bold' : ''}`}>
                  {item.quantity}
                </td>
                <td className="text-center">{formatCurrency(item.unitValue)}</td>
                <td className="text-center">{formatCurrency(item.value)}</td>
                <td className="text-center">{item.location}</td>
                <td className="text-center">{item.category}</td>
                <td className="text-center">
                  <Link
                    to={`/items/${item.id}/edit`}
                    className="btn btn-sm btn-outline-primary me-1"
                    aria-label={`Edit ${item.name}`}
                  >
                    <FaEdit aria-hidden="true" />
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setDeleteModalItem(item)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <FaTrash aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="table-secondary">
              <td></td>
              <td colSpan={2}><strong>Totals ({filteredItems.length} items)</strong></td>
              <td className="text-center"><strong>{totalQuantity}</strong></td>
              <td className="text-center"></td>
              <td className="text-center"><strong>{formatCurrency(totalValue)}</strong></td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </Table>

        {items.length === 0 ? (
          <EmptyState
            icon={FaBoxOpen}
            title="No items in inventory"
            description="Get started by adding your first inventory item."
            actionLabel="Add First Item"
            actionPath="/items/new"
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={FaBoxOpen}
            title="No items match your filters"
            description="Try adjusting your search or filter criteria."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </Card.Body>

      <ConfirmModal
        show={!!deleteModalItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteModalItem?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalItem(null)}
      />

      <ConfirmModal
        show={showBulkDeleteModal}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />

      <ConfirmModal
        show={showBulkCategoryModal}
        title="Change Category"
        message={`Change category of ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} to "${pendingCategory}"?`}
        confirmLabel="Change Category"
        confirmVariant="primary"
        onConfirm={confirmBulkCategoryChange}
        onCancel={() => {
          setShowBulkCategoryModal(false);
          setPendingCategory('');
        }}
      />
    </Card>
  );
}
