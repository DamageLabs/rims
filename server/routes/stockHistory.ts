import { Router, Request, Response } from 'express';
import { queryAll, run } from '../db/index';

const router = Router();

// GET / — list stock history with optional filters
router.get('/', (req: Request, res: Response) => {
  try {
    const { itemId, changeType, startDate, endDate, limit } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (itemId) {
      conditions.push('item_id = ?');
      params.push(itemId);
    }
    if (changeType) {
      conditions.push('change_type = ?');
      params.push(changeType);
    }
    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate);
    }

    let sql = 'SELECT * FROM stock_history';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY timestamp DESC';
    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }

    const history = queryAll(sql, params);
    res.json(history);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
});

// GET /recent — recent stock changes
router.get('/recent', (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const history = queryAll(
      'SELECT * FROM stock_history ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching recent stock history:', error);
    res.status(500).json({ error: 'Failed to fetch recent stock history' });
  }
});

// GET /item/:id — stock history for a specific item
router.get('/item/:id', (req: Request, res: Response) => {
  try {
    const history = queryAll(
      'SELECT * FROM stock_history WHERE item_id = ? ORDER BY timestamp DESC',
      [req.params.id]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching item stock history:', error);
    res.status(500).json({ error: 'Failed to fetch item stock history' });
  }
});

// GET /stats — stock history stats (filtered entries for frontend)
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate);
    }

    let sql = 'SELECT * FROM stock_history';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY timestamp DESC';

    const history = queryAll(sql, params);
    res.json(history);
  } catch (error) {
    console.error('Error fetching stock history stats:', error);
    res.status(500).json({ error: 'Failed to fetch stock history stats' });
  }
});

// DELETE / — clear all stock history
router.delete('/', (_req: Request, res: Response) => {
  try {
    run('DELETE FROM stock_history');
    res.json({ message: 'Stock history cleared' });
  } catch (error) {
    console.error('Error clearing stock history:', error);
    res.status(500).json({ error: 'Failed to clear stock history' });
  }
});

export default router;
