import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, update, deleteById } from '../db/index';

const router = Router();
const JSON_FIELDS = ['items'];

interface BomItem {
  itemId: number;
  quantity: number;
}

interface Bom {
  id: number;
  name: string;
  description: string;
  items: BomItem[];
  createdAt: string;
  updatedAt: string;
}

// GET / — list all BOMs
router.get('/', (_req: Request, res: Response) => {
  try {
    const boms = queryAll('SELECT * FROM boms ORDER BY name', [], JSON_FIELDS);
    res.json(boms);
  } catch (error) {
    console.error('Error fetching BOMs:', error);
    res.status(500).json({ error: 'Failed to fetch BOMs' });
  }
});

// GET /:id — get one BOM
router.get('/:id', (req: Request, res: Response) => {
  try {
    const bom = queryOne('SELECT * FROM boms WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!bom) {
      res.status(404).json({ error: 'BOM not found' });
      return;
    }
    res.json(bom);
  } catch (error) {
    console.error('Error fetching BOM:', error);
    res.status(500).json({ error: 'Failed to fetch BOM' });
  }
});

// POST / — create BOM
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, items } = req.body;
    const now = new Date().toISOString();
    const bom = insert('boms', {
      name, description, items, createdAt: now, updatedAt: now,
    }, JSON_FIELDS);
    res.status(201).json(bom);
  } catch (error) {
    console.error('Error creating BOM:', error);
    res.status(500).json({ error: 'Failed to create BOM' });
  }
});

// PUT /:id — update BOM
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description, items } = req.body;

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (items !== undefined) data.items = items;

    const bom = update('boms', id, data, JSON_FIELDS);
    if (!bom) {
      res.status(404).json({ error: 'BOM not found' });
      return;
    }
    res.json(bom);
  } catch (error) {
    console.error('Error updating BOM:', error);
    res.status(500).json({ error: 'Failed to update BOM' });
  }
});

// DELETE /:id — delete BOM
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteById('boms', id);
    if (!deleted) {
      res.status(404).json({ error: 'BOM not found' });
      return;
    }
    res.json({ message: 'BOM deleted' });
  } catch (error) {
    console.error('Error deleting BOM:', error);
    res.status(500).json({ error: 'Failed to delete BOM' });
  }
});

// GET /:id/cost — calculate BOM cost breakdown
router.get('/:id/cost', (req: Request, res: Response) => {
  try {
    const bom = queryOne<Bom>('SELECT * FROM boms WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!bom) {
      res.status(404).json({ error: 'BOM not found' });
      return;
    }

    const breakdown: Array<{
      itemId: number;
      name: string;
      unitValue: number;
      quantity: number;
      totalCost: number;
    }> = [];
    let totalCost = 0;

    for (const bomItem of (bom.items || [])) {
      const item = queryOne<{ id: number; name: string; unitValue: number; quantity: number }>(
        'SELECT * FROM items WHERE id = ?',
        [bomItem.itemId]
      );
      if (item) {
        const lineCost = item.unitValue * bomItem.quantity;
        breakdown.push({
          itemId: item.id,
          name: item.name,
          unitValue: item.unitValue,
          quantity: bomItem.quantity,
          totalCost: lineCost,
        });
        totalCost += lineCost;
      }
    }

    res.json({ bomId: bom.id, bomName: bom.name, breakdown, totalCost });
  } catch (error) {
    console.error('Error calculating BOM cost:', error);
    res.status(500).json({ error: 'Failed to calculate BOM cost' });
  }
});

// POST /:id/duplicate — duplicate BOM with new name
router.post('/:id/duplicate', (req: Request, res: Response) => {
  try {
    const bom = queryOne<Bom>('SELECT * FROM boms WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!bom) {
      res.status(404).json({ error: 'BOM not found' });
      return;
    }

    const { name } = req.body;
    const now = new Date().toISOString();
    const newBom = insert('boms', {
      name: name || `${bom.name} (Copy)`,
      description: bom.description,
      items: bom.items,
      createdAt: now,
      updatedAt: now,
    }, JSON_FIELDS);
    res.status(201).json(newBom);
  } catch (error) {
    console.error('Error duplicating BOM:', error);
    res.status(500).json({ error: 'Failed to duplicate BOM' });
  }
});

export default router;
