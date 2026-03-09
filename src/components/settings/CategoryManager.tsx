import { useState, useEffect, FormEvent } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Category } from '../../types/Category';
import { InventoryType } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import Breadcrumbs from '../common/Breadcrumbs';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [filterTypeId, setFilterTypeId] = useState<string>('');
  const [itemCounts, setItemCounts] = useState<Map<string, number>>(new Map());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [modalTypeId, setModalTypeId] = useState<number>(1);
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    setInventoryTypes(inventoryTypeService.getAllTypes());
    loadCategories();
  }, []);

  const loadCategories = () => {
    if (filterTypeId) {
      setCategories(categoryService.getCategoriesByType(parseInt(filterTypeId)));
    } else {
      setCategories(categoryService.getAllCategories());
    }
    const counts = categoryService.getCategoryItemCounts();
    setItemCounts(new Map(counts.map((c) => [c.name, c.count])));
  };

  useEffect(() => {
    loadCategories();
  }, [filterTypeId]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setModalTypeId(category.inventoryTypeId);
    } else {
      setEditingCategory(null);
      setName('');
      setModalTypeId(filterTypeId ? parseInt(filterTypeId) : inventoryTypes[0]?.id || 1);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setName('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        categoryService.updateCategory(editingCategory.id, { name });
        showSuccess(`Category updated to "${name}".`);
      } else {
        categoryService.createCategory({ name, sortOrder: categories.length, inventoryTypeId: modalTypeId });
        showSuccess(`Category "${name}" created.`);
      }
      handleCloseModal();
      loadCategories();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Operation failed.');
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    try {
      categoryService.deleteCategory(deleteTarget.id);
      showSuccess(`Category "${deleteTarget.name}" deleted.`);
      loadCategories();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete category.');
    }
    setDeleteTarget(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const orderedIds = newOrder.map((c) => c.id);
    categoryService.reorderCategories(orderedIds);
    loadCategories();
  };

  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const orderedIds = newOrder.map((c) => c.id);
    categoryService.reorderCategories(orderedIds);
    loadCategories();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Settings' },
          { label: 'Categories' },
        ]}
      />
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Manage Categories</h4>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <FaPlus className="me-1" /> New Category
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3 g-2 align-items-end">
            <Col md={4}>
              <Form.Label>Filter by Inventory Type</Form.Label>
              <Form.Select value={filterTypeId} onChange={(e) => setFilterTypeId(e.target.value)}>
                <option value="">All Types</option>
                {inventoryTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col>
              <p className="text-muted mb-0">
                Categories are scoped to inventory types. Categories in use cannot be deleted.
              </p>
            </Col>
          </Row>

          {categories.length === 0 ? (
            <p className="text-center py-4 text-muted">
              No categories defined. Create one to get started.
            </p>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ width: '120px' }}>Items</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => {
                  const count = itemCounts.get(category.name) || 0;
                  return (
                    <tr key={category.id}>
                      <td className="text-center">
                        <div className="d-flex flex-column gap-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            aria-label="Move up"
                          >
                            <FaArrowUp />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            disabled={index === categories.length - 1}
                            onClick={() => handleMoveDown(index)}
                            aria-label="Move down"
                          >
                            <FaArrowDown />
                          </Button>
                        </div>
                      </td>
                      <td className="align-middle">{category.name}</td>
                      <td className="align-middle">
                        <small>{inventoryTypes.find((t) => t.id === category.inventoryTypeId)?.name || '-'}</small>
                      </td>
                      <td className="align-middle">
                        <Badge bg={count > 0 ? 'primary' : 'secondary'}>{count}</Badge>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal(category)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setDeleteTarget(category)}
                            disabled={count > 0}
                            title={count > 0 ? 'Cannot delete: category has items' : 'Delete category'}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'New Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="mb-3">
              <Form.Label column sm={3}>Type</Form.Label>
              <Col sm={9}>
                <Form.Select
                  value={modalTypeId}
                  onChange={(e) => setModalTypeId(parseInt(e.target.value))}
                  disabled={!!editingCategory}
                >
                  {inventoryTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="mb-3">
              <Form.Label column sm={3}>Name</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Sensors"
                  autoFocus
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
