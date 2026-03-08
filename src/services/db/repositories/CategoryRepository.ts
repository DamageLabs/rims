import { BaseRepository } from '../BaseRepository';
import { Category } from '../../../types/Category';
import { execQuery, execStatement } from '../db';

export class CategoryRepository extends BaseRepository<Category> {
  protected tableName = 'categories';

  /**
   * Get all categories ordered by sort_order
   */
  getAllSorted(): Category[] {
    return this.query(`SELECT * FROM ${this.tableName} ORDER BY sort_order ASC, name ASC`);
  }

  /**
   * Find a category by name (case-insensitive)
   */
  findByName(name: string): Category | null {
    return this.queryOne(
      `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER(?)`,
      [name]
    );
  }

  /**
   * Check if a category name already exists (optionally excluding a specific ID)
   */
  nameExists(name: string, excludeId?: number): boolean {
    const sql = excludeId
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE LOWER(name) = LOWER(?) AND id != ?`
      : `SELECT COUNT(*) as count FROM ${this.tableName} WHERE LOWER(name) = LOWER(?)`;
    const params = excludeId ? [name, excludeId] : [name];
    const rows = execQuery<{ count: number }>(sql, params);
    return rows.length > 0 && rows[0].count > 0;
  }

  /**
   * Get the next sort order value
   */
  getNextSortOrder(): number {
    const rows = execQuery<{ max_order: number | null }>(
      `SELECT MAX(sort_order) as max_order FROM ${this.tableName}`
    );
    return (rows[0]?.max_order ?? -1) + 1;
  }

  /**
   * Update sort orders for multiple categories
   */
  updateSortOrders(updates: Array<{ id: number; sortOrder: number }>): void {
    for (const { id, sortOrder } of updates) {
      execStatement(
        `UPDATE ${this.tableName} SET sort_order = ?, updated_at = ? WHERE id = ?`,
        [sortOrder, new Date().toISOString(), id]
      );
    }
  }

  /**
   * Check if a category is in use by any items
   */
  isInUse(categoryName: string): boolean {
    const rows = execQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE category = ?',
      [categoryName]
    );
    return rows.length > 0 && rows[0].count > 0;
  }

  /**
   * Get item count per category
   */
  getItemCounts(): Array<{ name: string; count: number }> {
    return execQuery<{ name: string; count: number }>(
      `SELECT c.name, COALESCE(item_counts.count, 0) as count
       FROM ${this.tableName} c
       LEFT JOIN (
         SELECT category as name, COUNT(*) as count FROM items GROUP BY category
       ) item_counts ON c.name = item_counts.name
       ORDER BY c.sort_order ASC`
    );
  }
}

export const categoryRepository = new CategoryRepository();
