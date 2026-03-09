import { useState, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';

interface ItemFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}

export default function ItemFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onReset,
}: ItemFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const hasFilters = searchTerm || categoryFilter;

  useEffect(() => {
    setCategories(categoryService.getCategoryNames());
  }, []);

  return (
    <Row className="mb-3 g-2">
      <Col md={6}>
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search by name, description, vendor, location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
      </Col>
      <Col md={4}>
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
