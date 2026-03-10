import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Table, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';
import * as bomService from '../../services/bomService';
import * as itemService from '../../services/itemService';
import { BOMFormData, BOMItem } from '../../types/BOM';
import { Item } from '../../types/Item';
import { useAlert } from '../../contexts/AlertContext';
import Breadcrumbs from '../common/Breadcrumbs';

export default function BOMForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const isEditing = !!id;

  const [formData, setFormData] = useState<BOMFormData>({
    name: '',
    description: '',
    items: [],
  });

  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  useEffect(() => {
    const loadData = async () => {
      const items = await itemService.getAllItems();
      setAvailableItems(items);

      if (id) {
        const bom = await bomService.getBOMById(parseInt(id));
        if (bom) {
          setFormData({
            name: bom.name,
            description: bom.description,
            items: bom.items,
          });
        } else {
          showError('BOM not found.');
          navigate('/bom');
        }
      }
    };
    loadData();
  }, [id, navigate, showError]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;

    const itemId = parseInt(selectedItemId);
    const exists = formData.items.some((i) => i.itemId === itemId);

    if (exists) {
      showError('This item is already in the BOM.');
      return;
    }

    const newItem: BOMItem = {
      itemId,
      quantity: selectedQuantity,
      notes: '',
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedItemId('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (itemId: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.itemId !== itemId),
    }));
  };

  const handleItemQuantityChange = (itemId: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    }));
  };

  const handleItemNotesChange = (itemId: number, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.itemId === itemId ? { ...i, notes } : i
      ),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      showError('Please add at least one item to the BOM.');
      return;
    }

    try {
      if (isEditing) {
        const updated = await bomService.updateBOM(parseInt(id!), formData);
        if (updated) {
          showSuccess('BOM updated successfully.');
          navigate(`/bom/${updated.id}`);
        } else {
          showError('Failed to update BOM.');
        }
      } else {
        const created = await bomService.createBOM(formData);
        showSuccess('BOM created successfully.');
        navigate(`/bom/${created.id}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Operation failed.');
    }
  };

  const getItemName = (itemId: number): string => {
    const item = availableItems.find((i) => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const getItemPrice = (itemId: number): number => {
    const item = availableItems.find((i) => i.id === itemId);
    return item?.unitValue || 0;
  };

  const calculateTotal = (): number => {
    return formData.items.reduce((sum, bomItem) => {
      const price = getItemPrice(bomItem.itemId);
      return sum + price * bomItem.quantity;
    }, 0);
  };

  // Items not yet added to BOM
  const itemsNotInBOM = availableItems.filter(
    (item) => !formData.items.some((bi) => bi.itemId === item.id)
  );

  const breadcrumbItems = isEditing
    ? [
        { label: 'Bill of Materials', path: '/bom' },
        { label: formData.name || 'Edit BOM', path: `/bom/${id}` },
        { label: 'Edit' },
      ]
    : [
        { label: 'Bill of Materials', path: '/bom' },
        { label: 'New BOM' },
      ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Card>
        <Card.Header>
          <h4 className="mb-0">{isEditing ? 'Edit BOM' : 'New BOM'}</h4>
        </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Label column sm={3}>Name</Form.Label>
            <Col sm={6}>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Arduino Weather Station"
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Form.Label column sm={3}>Description</Form.Label>
            <Col sm={6}>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this project or assembly..."
              />
            </Col>
          </Row>

          <hr />

          <h5>Components</h5>

          <Row className="mb-3 align-items-end">
            <Col sm={5}>
              <Form.Label>Select Item</Form.Label>
              <Form.Select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">-- Choose an item --</option>
                {itemsNotInBOM.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (${item.unitValue.toFixed(2)})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col sm={2}>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
              />
            </Col>
            <Col sm={2}>
              <Button
                variant="outline-primary"
                onClick={handleAddItem}
                disabled={!selectedItemId}
              >
                <FaPlus className="me-1" /> Add
              </Button>
            </Col>
          </Row>

          {formData.items.length > 0 && (
            <Table striped bordered size="sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: '100px' }}>Qty</th>
                  <th style={{ width: '100px' }}>Unit Price</th>
                  <th style={{ width: '100px' }}>Line Total</th>
                  <th>Notes</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((bomItem) => (
                  <tr key={bomItem.itemId}>
                    <td>{getItemName(bomItem.itemId)}</td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        min={1}
                        value={bomItem.quantity}
                        onChange={(e) =>
                          handleItemQuantityChange(bomItem.itemId, parseInt(e.target.value) || 1)
                        }
                      />
                    </td>
                    <td>${getItemPrice(bomItem.itemId).toFixed(2)}</td>
                    <td>
                      ${(getItemPrice(bomItem.itemId) * bomItem.quantity).toFixed(2)}
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={bomItem.notes}
                        onChange={(e) => handleItemNotesChange(bomItem.itemId, e.target.value)}
                        placeholder="Optional notes"
                      />
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveItem(bomItem.itemId)}
                        aria-label={`Remove ${getItemName(bomItem.itemId)}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">Total:</th>
                  <th>${calculateTotal().toFixed(2)}</th>
                  <th colSpan={2}></th>
                </tr>
              </tfoot>
            </Table>
          )}

          {formData.items.length === 0 && (
            <p className="text-muted text-center py-3">
              No items added yet. Select an item above and click Add.
            </p>
          )}

          <hr />

          <ButtonGroup>
            <Button variant="primary" type="submit">
              {isEditing ? 'Update BOM' : 'Create BOM'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/bom')}>
              Cancel
            </Button>
          </ButtonGroup>
        </Form>
      </Card.Body>
      </Card>
    </>
  );
}
