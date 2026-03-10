export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function mapRowToEntity<T>(
  row: Record<string, unknown>,
  jsonFields: string[] = []
): T {
  const entity: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    if (jsonFields.includes(camelKey) && typeof value === 'string') {
      try {
        entity[camelKey] = JSON.parse(value);
      } catch {
        entity[camelKey] = value;
      }
    } else {
      entity[camelKey] = value;
    }
  }
  return entity as T;
}

export function mapEntityToRow(
  entity: Record<string, unknown>,
  jsonFields: string[] = []
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    const snakeKey = toSnakeCase(key);
    if (jsonFields.includes(key) && typeof value === 'object' && value !== null) {
      row[snakeKey] = JSON.stringify(value);
    } else {
      row[snakeKey] = value;
    }
  }
  return row;
}

export function mapRowsToEntities<T>(
  rows: Record<string, unknown>[],
  jsonFields: string[] = []
): T[] {
  return rows.map((row) => mapRowToEntity<T>(row, jsonFields));
}

export function buildInsertSQL(
  tableName: string,
  data: Record<string, unknown>,
  jsonFields: string[] = []
): { sql: string; params: unknown[] } {
  const row = mapEntityToRow(data, jsonFields);
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const params = Object.values(row);
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  return { sql, params };
}

export function buildUpdateSQL(
  tableName: string,
  data: Record<string, unknown>,
  whereClause: string,
  whereParams: unknown[],
  jsonFields: string[] = []
): { sql: string; params: unknown[] } {
  const row = mapEntityToRow(data, jsonFields);
  const setClause = Object.keys(row).map((col) => `${col} = ?`).join(', ');
  const params = [...Object.values(row), ...whereParams];
  const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
  return { sql, params };
}
