import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, update, deleteById } from '../db/index';

const router = Router();
const JSON_FIELDS = ['defaultFields'];

// GET / — list all templates
router.get('/', (_req: Request, res: Response) => {
  try {
    const templates = queryAll('SELECT * FROM item_templates ORDER BY name', [], JSON_FIELDS);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /:id — get one template
router.get('/:id', (req: Request, res: Response) => {
  try {
    const template = queryOne('SELECT * FROM item_templates WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST / — create template
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, category, defaultFields } = req.body;
    const now = new Date().toISOString();
    const template = insert('item_templates', {
      name, category, defaultFields, createdAt: now, updatedAt: now,
    }, JSON_FIELDS);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /:id — update template
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, category, defaultFields } = req.body;

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (defaultFields !== undefined) data.defaultFields = defaultFields;

    const template = update('item_templates', id, data, JSON_FIELDS);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /:id — delete template
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteById('item_templates', id);
    if (!deleted) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
