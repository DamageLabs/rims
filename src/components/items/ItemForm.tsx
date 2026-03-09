import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, ButtonGroup, Spinner, Badge } from 'react-bootstrap';
import * as itemService from '../../services/itemService';
import * as itemTemplateService from '../../services/itemTemplateService';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { ItemFormData } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { ItemTemplate } from '../../types/ItemTemplate';
import { useAlert } from '../../contexts/AlertContext';
import { compressImage, formatBytes, compressionPercent } from '../../utils/imageOptimizer';
import CustomFieldRenderer from './CustomFieldRenderer';
import Breadcrumbs from '../common/Breadcrumbs';

export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useAlert();
  const isEditing = !!id;

  const initialBarcode = searchParams.get('barcode') || '';

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    quantity: 0,
    unitValue: 0,
    picture: null,
    category: '',
    location: '',
    barcode: initialBarcode,
    reorderPoint: 0,
    inventoryTypeId: 1,
    customFields: {},
  });

  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageCompression, setImageCompression] = useState<{
    originalSize: number;
    compressedSize: number;
    wasCompressed: boolean;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);

  // Load inventory types
  useEffect(() => {
    setInventoryTypes(inventoryTypeService.getAllTypes());
  }, []);

  // Load categories when type changes
  useEffect(() => {
    if (formData.inventoryTypeId) {
      const cats = categoryService.getCategoryNamesByType(formData.inventoryTypeId);
      setCategories(cats);
      if (!isEditing && cats.length > 0 && !cats.includes(formData.category)) {
        setFormData((prev) => ({ ...prev, category: cats[0] }));
      }
    }
  }, [formData.inventoryTypeId, isEditing]);

  useEffect(() => {
    if (id) {
      const item = itemService.getItemById(parseInt(id));
      if (item) {
        setFormData({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitValue: item.unitValue,
          picture: item.picture,
          category: item.category,
          location: item.location,
          barcode: item.barcode,
          reorderPoint: item.reorderPoint,
          inventoryTypeId: item.inventoryTypeId,
          customFields: item.customFields || {},
        });
        if (item.picture) {
          setPreviewImage(item.picture);
        }
      } else {
        showError('Item not found.');
        navigate('/items');
      }
    }
  }, [id, navigate, showError]);

  useEffect(() => {
    if (!isEditing) {
      setTemplates(itemTemplateService.getAllTemplates());
    }
  }, [isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const typeId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      inventoryTypeId: typeId,
      customFields: {},
    }));
  };

  const handleCustomFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value },
    }));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      setImageCompression(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await compressImage(base64);
          setFormData((prev) => ({ ...prev, picture: result.data }));
          setPreviewImage(result.data);
          setImageCompression({
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            wasCompressed: result.wasCompressed,
          });
        } catch {
          setFormData((prev) => ({ ...prev, picture: base64 }));
          setPreviewImage(base64);
        } finally {
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, picture: null }));
    setPreviewImage(null);
    setImageCompression(null);
  };

  const handleTemplateSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const template = itemTemplateService.getTemplateById(parseInt(templateId));
    if (template) {
      setFormData((prev) => ({
        ...prev,
        ...template.defaultFields,
        category: template.category,
      }));
      showSuccess(`Template "${template.name}" applied.`);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updatedItem = itemService.updateItem(parseInt(id!), formData);
        if (updatedItem) {
          showSuccess('Item was successfully updated.');
          navigate(`/items/${updatedItem.id}`);
        } else {
          showError('Failed to update item.');
        }
      } else {
        const newItem = itemService.createItem(formData);
        showSuccess('Item was successfully created.');
        navigate(`/items/${newItem.id}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Operation failed.');
    }
  };

  const currentType = inventoryTypes.find((t) => t.id === formData.inventoryTypeId);

  const breadcrumbItems = isEditing
    ? [
        { label: 'Inventory', path: '/items' },
        { label: formData.name || 'Edit Item', path: `/items/${id}` },
        { label: 'Edit' },
      ]
    : [
        { label: 'Inventory', path: '/items' },
        { label: 'New Item' },
      ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Card>
        <Card.Header>
          <h4 className="mb-0">{isEditing ? 'Edit Item' : 'New Item'}</h4>
        </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {!isEditing && templates.length > 0 && (
            <Row className="mb-4">
              <Form.Label column sm={3}>Use Template</Form.Label>
              <Col sm={5}>
                <Form.Select onChange={handleTemplateSelect} defaultValue="">
                  <option value="">-- Select a template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          )}

          {/* Basic Information Section */}
          <fieldset className="mb-4">
            <legend className="h6 text-muted border-bottom pb-2 mb-3">Basic Information</legend>
            <Row className="mb-3">
              <Form.Label column sm={3}>Inventory Type</Form.Label>
              <Col sm={5}>
                <Form.Select
                  name="inventoryTypeId"
                  value={formData.inventoryTypeId}
                  onChange={handleTypeChange}
                >
                  {inventoryTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Name <span className="text-danger">*</span></Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Description</Form.Label>
              <Col sm={5}>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Category</Form.Label>
              <Col sm={5}>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.length === 0 && <option value="">No categories</option>}
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </fieldset>

          {/* Dynamic Custom Fields */}
          {currentType && currentType.schema.length > 0 && (
            <CustomFieldRenderer
              schema={currentType.schema}
              values={formData.customFields}
              onChange={handleCustomFieldChange}
            />
          )}

          {/* Inventory Details Section */}
          <fieldset className="mb-4">
            <legend className="h6 text-muted border-bottom pb-2 mb-3">Inventory Details</legend>
            <Row className="mb-3">
              <Form.Label column sm={3}>Quantity</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min={0}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Unit Value ($)</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="number"
                  name="unitValue"
                  value={formData.unitValue}
                  onChange={handleChange}
                  min={0}
                  step={0.01}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Location</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A3, Bin 12"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Barcode</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="e.g., RIMS-0001 or UPC"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Form.Label column sm={3}>Reorder Point</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="number"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                  min={0}
                />
                <Form.Text className="text-muted">
                  Alert when quantity falls to or below this level
                </Form.Text>
              </Col>
            </Row>
          </fieldset>

          {/* Media Section */}
          <fieldset className="mb-4">
            <legend className="h6 text-muted border-bottom pb-2 mb-3">Media</legend>
            <Row className="mb-3">
              <Form.Label column sm={3}>Picture</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isCompressing}
                />
                {isCompressing && (
                  <div className="mt-2">
                    <Spinner size="sm" animation="border" className="me-2" />
                    Compressing image...
                  </div>
                )}
                {previewImage && !isCompressing && (
                  <div className="mt-2">
                    <img
                      src={previewImage}
                      alt="Preview"
                      style={{ maxWidth: '250px', maxHeight: '200px' }}
                      className="img-thumbnail"
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      Remove
                    </Button>
                    {imageCompression && (
                      <div className="mt-1">
                        {imageCompression.wasCompressed ? (
                          <Badge bg="success">
                            Compressed: {formatBytes(imageCompression.originalSize)} → {formatBytes(imageCompression.compressedSize)}
                            ({compressionPercent(imageCompression.originalSize, imageCompression.compressedSize)}% saved)
                          </Badge>
                        ) : (
                          <Badge bg="secondary">
                            Size: {formatBytes(imageCompression.originalSize)} (no compression needed)
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Col>
            </Row>
          </fieldset>

          <Row>
            <Col sm={{ span: 5, offset: 3 }}>
              <ButtonGroup>
                <Button variant="primary" type="submit">
                  {isEditing ? 'Update Item' : 'Create Item'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/items')}>
                  Cancel
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Form>
      </Card.Body>
      </Card>
    </>
  );
}
