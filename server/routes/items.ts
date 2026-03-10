import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run, insert, update, deleteById, getDatabase } from '../db/index';

const router = Router();
const JSON_FIELDS = ['customFields'];

// GET / — Get all items
router.get('/', (_req: Request, res: Response) => {
  try {
    const items = queryAll('SELECT * FROM items ORDER BY name', [], JSON_FIELDS);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /stats — Return totalQuantity and totalValue
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT COALESCE(SUM(quantity), 0) as totalQuantity, COALESCE(SUM(value), 0) as totalValue FROM items').get() as { totalQuantity: number; totalValue: number };
    res.json(row);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /reorder — Items needing reorder
router.get('/reorder', (_req: Request, res: Response) => {
  try {
    const items = queryAll(
      'SELECT * FROM items WHERE quantity <= reorder_point AND reorder_point > 0 ORDER BY name',
      [],
      JSON_FIELDS
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching reorder items:', error);
    res.status(500).json({ error: 'Failed to fetch reorder items' });
  }
});

// GET /low-stock — Items below threshold
router.get('/low-stock', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string, 10) || 10;
    const items = queryAll(
      'SELECT * FROM items WHERE quantity < ? ORDER BY name',
      [threshold],
      JSON_FIELDS
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// POST /bulk-delete — Delete multiple items (must be before /:id)
router.post('/bulk-delete', (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    const txn = db.transaction(() => {
      for (const id of ids) {
        const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
        if (existing) {
          run(
            'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, existing.name, 'deleted', existing.quantity, 0, existing.value, 0, existing.category, null, 'Bulk delete', null, null, now]
          );
          deleteById('items', id);
        }
      }
    });
    txn();

    res.json({ message: `Deleted ${ids.length} items` });
  } catch (error) {
    console.error('Error bulk deleting items:', error);
    res.status(500).json({ error: 'Failed to bulk delete items' });
  }
});

// PUT /bulk-category — Update category for multiple items (must be before /:id)
router.put('/bulk-category', (req: Request, res: Response) => {
  try {
    const { ids, category } = req.body as { ids: number[]; category: string };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }
    if (category === undefined) {
      res.status(400).json({ error: 'category is required' });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    const txn = db.transaction(() => {
      for (const id of ids) {
        const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
        if (existing) {
          run(
            'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, existing.name, 'category_change', existing.quantity, existing.quantity, existing.value, existing.value, existing.category, category, 'Bulk category update', null, null, now]
          );
          update('items', id, { category, updatedAt: now }, JSON_FIELDS);
        }
      }
    });
    txn();

    res.json({ message: `Updated category for ${ids.length} items` });
  } catch (error) {
    console.error('Error bulk updating category:', error);
    res.status(500).json({ error: 'Failed to bulk update category' });
  }
});

// GET /:id — Get item by id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const item = queryOne('SELECT * FROM items WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST / — Create item
router.post('/', (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const { name, description, quantity, unitValue, picture, category, location, barcode, reorderPoint, inventoryTypeId, customFields } = req.body;
    const qty = quantity || 0;
    const uv = unitValue || 0;
    const value = qty * uv;

    const item = insert('items', {
      name: name || '',
      description: description || '',
      quantity: qty,
      unitValue: uv,
      value,
      picture: picture || null,
      category: category || '',
      location: location || '',
      barcode: barcode || '',
      reorderPoint: reorderPoint || 0,
      inventoryTypeId: inventoryTypeId || 1,
      customFields: customFields || {},
      createdAt: now,
      updatedAt: now,
    }, JSON_FIELDS);

    const created = item as Record<string, unknown>;
    run(
      'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [created.id, name || '', 'created', 0, qty, 0, value, null, category || '', 'Item created', null, null, now]
    );

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /:id — Update item
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const now = new Date().toISOString();
    const merged = { ...existing, ...req.body, updatedAt: now };
    const qty = merged.quantity || 0;
    const uv = merged.unitValue || 0;
    merged.value = qty * uv;
    delete merged.id;

    const updated = update('items', id, merged, JSON_FIELDS);

    if (existing.quantity !== qty) {
      run(
        'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, merged.name, 'updated', existing.quantity, qty, existing.value, merged.value, existing.category, merged.category, 'Quantity updated', null, null, now]
      );
    }

    if (existing.unitValue !== uv) {
      run(
        'INSERT INTO cost_history (item_id, old_value, new_value, source, timestamp) VALUES (?, ?, ?, ?, ?)',
        [id, existing.unitValue, uv, 'manual', now]
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /:id — Delete item
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const now = new Date().toISOString();
    run(
      'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, existing.name, 'deleted', existing.quantity, 0, existing.value, 0, existing.category, null, 'Item deleted', null, null, now]
    );

    deleteById('items', id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
