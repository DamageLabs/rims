import { Router, Request, Response } from 'express';
import { queryAll, run } from '../db/index';

const router = Router();

interface CostEntry {
  id: number;
  itemId: number;
  unitValue: number;
  timestamp: string;
}

// GET /item/:id — cost history for a specific item
router.get('/item/:id', (req: Request, res: Response) => {
  try {
    const history = queryAll(
      'SELECT * FROM cost_history WHERE item_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching cost history:', error);
    res.status(500).json({ error: 'Failed to fetch cost history' });
  }
});

// GET /item/:id/stats — cost history stats with computed values
router.get('/item/:id/stats', (req: Request, res: Response) => {
  try {
    const { currentValue } = req.query;
    const history = queryAll<CostEntry>(
      'SELECT * FROM cost_history WHERE item_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );

    const values = history.map(h => h.unitValue);
    if (currentValue !== undefined) {
      values.push(Number(currentValue));
    }

    let min = 0;
    let max = 0;
    let avg = 0;
    let trend = 'stable';

    if (values.length > 0) {
      min = Math.min(...values);
      max = Math.max(...values);
      avg = values.reduce((sum, v) => sum + v, 0) / values.length;

      if (values.length >= 2) {
        const last = values[values.length - 1];
        const prev = values[values.length - 2];
        if (last > prev) trend = 'up';
        else if (last < prev) trend = 'down';
      }
    }

    res.json({ history, stats: { min, max, avg, trend } });
  } catch (error) {
    console.error('Error fetching cost history stats:', error);
    res.status(500).json({ error: 'Failed to fetch cost history stats' });
  }
});

// DELETE /item/:id — delete cost history for a specific item
router.delete('/item/:id', (req: Request, res: Response) => {
  try {
    const result = run('DELETE FROM cost_history WHERE item_id = ?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('Error deleting cost history:', error);
    res.status(500).json({ error: 'Failed to delete cost history' });
  }
});

export default router;
