import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, update, deleteById, count } from '../db/index';

const router = Router();
const JSON_FIELDS = ['schema'];

// GET / — list all inventory types
router.get('/', (_req: Request, res: Response) => {
  try {
    const types = queryAll('SELECT * FROM inventory_types ORDER BY name', [], JSON_FIELDS);
    res.json(types);
  } catch (error) {
    console.error('Error fetching inventory types:', error);
    res.status(500).json({ error: 'Failed to fetch inventory types' });
  }
});

// GET /:id — get one inventory type
router.get('/:id', (req: Request, res: Response) => {
  try {
    const type = queryOne('SELECT * FROM inventory_types WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!type) {
      res.status(404).json({ error: 'Inventory type not found' });
      return;
    }
    res.json(type);
  } catch (error) {
    console.error('Error fetching inventory type:', error);
    res.status(500).json({ error: 'Failed to fetch inventory type' });
  }
});

// POST / — create inventory type
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, icon, schema } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const existing = queryOne('SELECT id FROM inventory_types WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing) {
      res.status(400).json({ error: 'An inventory type with this name already exists' });
      return;
    }

    const now = new Date().toISOString();
    const type = insert('inventory_types', { name, icon, schema, createdAt: now, updatedAt: now }, JSON_FIELDS);
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating inventory type:', error);
    res.status(500).json({ error: 'Failed to create inventory type' });
  }
});

// PUT /:id — update inventory type
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, icon, schema } = req.body;

    if (name) {
      const existing = queryOne<{ id: number }>(
        'SELECT id FROM inventory_types WHERE LOWER(name) = LOWER(?) AND id != ?',
        [name, id]
      );
      if (existing) {
        res.status(400).json({ error: 'An inventory type with this name already exists' });
        return;
      }
    }

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) data.name = name;
    if (icon !== undefined) data.icon = icon;
    if (schema !== undefined) data.schema = schema;

    const type = update('inventory_types', id, data, JSON_FIELDS);
    if (!type) {
      res.status(404).json({ error: 'Inventory type not found' });
      return;
    }
    res.json(type);
  } catch (error) {
    console.error('Error updating inventory type:', error);
    res.status(500).json({ error: 'Failed to update inventory type' });
  }
});

// DELETE /:id — delete inventory type if not in use
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const itemCount = count('items', 'inventory_type_id = ?', [id]);
    if (itemCount > 0) {
      res.status(400).json({ error: `Cannot delete: ${itemCount} item(s) are using this inventory type` });
      return;
    }

    const deleted = deleteById('inventory_types', id);
    if (!deleted) {
      res.status(404).json({ error: 'Inventory type not found' });
      return;
    }
    res.json({ message: 'Inventory type deleted' });
  } catch (error) {
    console.error('Error deleting inventory type:', error);
    res.status(500).json({ error: 'Failed to delete inventory type' });
  }
});

export default router;
