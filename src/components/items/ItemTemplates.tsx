import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import * as itemTemplateService from '../../services/itemTemplateService';
import * as categoryService from '../../services/categoryService';
import { ItemTemplate, ItemTemplateFormData } from '../../types/ItemTemplate';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';

export default function ItemTemplates() {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemTemplate | null>(null);
  const { showSuccess, showError } = useAlert();

  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<ItemTemplateFormData>({
    name: '',
    category: '',
    defaultFields: {
      vendorName: '',
      vendorUrl: '',
      location: '',
      reorderPoint: 0,
      description: '',
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        await loadTemplates();
        const cats = await categoryService.getCategoryNames();
        setCategories(cats);
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category: prev.category || cats[0] }));
        }
      } catch {
        // silently handle
      }
    }
    loadData();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await itemTemplateService.getAllTemplates();
      setTemplates(allTemplates);
    } catch {
      // silently handle
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || '',
      defaultFields: {
        vendorName: '',
        vendorUrl: '',
        location: '',
        reorderPoint: 0,
        description: '',
      },
    });
    setEditingTemplate(null);
  };

  const handleOpenModal = (template?: ItemTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        defaultFields: { ...template.defaultFields },
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('default_')) {
      const fieldName = name.replace('default_', '');
      setFormData((prev) => ({
        ...prev,
        defaultFields: {
          ...prev.defaultFields,
          [fieldName]: name === 'default_reorderPoint' ? parseInt(value) || 0 : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const updated = await itemTemplateService.updateTemplate(editingTemplate.id, formData);
        if (updated) {
          showSuccess('Template updated successfully.');
        } else {
          showError('Failed to update template.');
        }
      } else {
        await itemTemplateService.createTemplate(formData);
        showSuccess('Template created successfully.');
      }

      handleCloseModal();
      await loadTemplates();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const success = await itemTemplateService.deleteTemplate(deleteTarget.id);
      if (success) {
        showSuccess(`Template "${deleteTarget.name}" deleted.`);
        await loadTemplates();
      } else {
        showError('Failed to delete template.');
      }
    } catch {
      showError('Failed to delete template.');
    }
    setDeleteTarget(null);
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Item Templates</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-1" /> New Template
        </Button>
      </Card.Header>
      <Card.Body>
        <p className="text-muted">
          Create templates to quickly fill in common values when adding new items.
        </p>

        {templates.length === 0 ? (
          <p className="text-center py-4 text-muted">
            No templates created yet. Create a template to speed up item entry.
          </p>
        ) : (
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Default Vendor</th>
                <th>Default Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{template.name}</td>
                  <td>
                    <Badge bg="secondary">{template.category}</Badge>
                  </td>
                  <td>{template.defaultFields.vendorName || '-'}</td>
                  <td>{template.defaultFields.location || '-'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenModal(template)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeleteTarget(template)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="mb-3">
              <Form.Label column sm={3}>Template Name</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Adafruit Sensor"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Category</Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <hr />
            <h6>Default Values</h6>

            <Row className="mb-3">
              <Form.Label column sm={3}>Vendor Name</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="default_vendorName"
                  value={formData.defaultFields.vendorName || ''}
                  onChange={handleChange}
                  placeholder="e.g., Adafruit"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Vendor URL</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="url"
                  name="default_vendorUrl"
                  value={formData.defaultFields.vendorUrl || ''}
                  onChange={handleChange}
                  placeholder="e.g., https://www.adafruit.com"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Location</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="default_location"
                  value={formData.defaultFields.location || ''}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A-1"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Reorder Point</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="number"
                  name="default_reorderPoint"
                  value={formData.defaultFields.reorderPoint || 0}
                  onChange={handleChange}
                  min={0}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Description</Form.Label>
              <Col sm={9}>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="default_description"
                  value={formData.defaultFields.description || ''}
                  onChange={handleChange}
                  placeholder="Default description text..."
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
