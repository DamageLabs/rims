import { useState, useEffect } from 'react';
import { ButtonGroup, Button, Dropdown } from 'react-bootstrap';
import { FaTrash, FaFolderOpen } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onCategoryChange: (category: string) => void;
}

export default function BulkActions({
  selectedCount,
  onDelete,
  onCategoryChange,
}: BulkActionsProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setCategories(categoryService.getCategoryNames());
  }, []);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 p-2 bg-light rounded d-flex align-items-center gap-2">
      <span className="me-2">
        <strong>{selectedCount}</strong> item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <ButtonGroup size="sm">
        <Button variant="outline-danger" onClick={onDelete}>
          <FaTrash className="me-1" />
          Delete Selected
        </Button>
        <Dropdown
          show={showCategoryDropdown}
          onToggle={setShowCategoryDropdown}
        >
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            <FaFolderOpen className="me-1" />
            Change Category
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {categories.map((category) => (
              <Dropdown.Item
                key={category}
                onClick={() => {
                  onCategoryChange(category);
                  setShowCategoryDropdown(false);
                }}
              >
                {category}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </ButtonGroup>
    </div>
  );
}
