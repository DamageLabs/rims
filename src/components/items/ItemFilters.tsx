import { useState, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { InventoryType } from '../../types/InventoryType';

interface ItemFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onReset: () => void;
}

export default function ItemFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  onReset,
}: ItemFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const hasFilters = searchTerm || categoryFilter || typeFilter;

  useEffect(() => {
    setInventoryTypes(inventoryTypeService.getAllTypes());
  }, []);

  useEffect(() => {
    if (typeFilter) {
      setCategories(categoryService.getCategoryNamesByType(parseInt(typeFilter)));
    } else {
      setCategories(categoryService.getCategoryNames());
    }
  }, [typeFilter]);

  return (
    <Row className="mb-3 g-2">
      <Col md={4}>
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search by name, description, custom fields..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
      </Col>
      <Col md={2}>
        <Form.Select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">All Types</option>
          {inventoryTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={3}>
        <Form.Select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={2}>
        <Button
          variant="outline-secondary"
          onClick={onReset}
          disabled={!hasFilters}
          className="w-100"
        >
          <FaTimes className="me-1" />
          Reset
        </Button>
      </Col>
    </Row>
  );
}
