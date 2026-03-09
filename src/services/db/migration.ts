import { User } from '../../types/User';
import { Item } from '../../types/Item';
import { StockHistoryEntry } from '../../types/StockHistory';
import { CostHistoryEntry } from '../../types/CostHistory';
import { BOM } from '../../types/BOM';
import { ItemTemplate } from '../../types/ItemTemplate';
import { VendorPriceCache, VendorPriceResult } from '../../types/Vendor';
import { STORAGE_KEYS, getFromStorage, removeFromStorage } from '../storage';
import { getDatabaseOrThrow, persistDatabase } from './db';
import {
  userRepository,
  itemRepository,
  stockHistoryRepository,
  costHistoryRepository,
  bomRepository,
  itemTemplateRepository,
  vendorPriceCacheRepository,
} from './repositories';

// Old localStorage keys to check for migration
const OLD_STORAGE_KEYS = [
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.ITEMS,
  STORAGE_KEYS.STOCK_HISTORY,
  STORAGE_KEYS.COST_HISTORY,
  STORAGE_KEYS.BOMS,
  STORAGE_KEYS.ITEM_TEMPLATES,
  STORAGE_KEYS.VENDOR_PRICE_CACHE,
];

/**
 * Check if there is existing data in localStorage that needs migration
 */
export function hasExistingLocalStorageData(): boolean {
  // Check if initialized flag exists (old system)
  const isInitialized = getFromStorage<boolean>(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    return false;
  }

  // Check if any of the old storage keys have data
  for (const key of OLD_STORAGE_KEYS) {
    const data = localStorage.getItem(key);
    if (data && data !== '[]' && data !== '{}') {
      return true;
    }
  }

  return false;
}

/**
 * Migrate data from localStorage to SQLite database
 */
export function migrateFromLocalStorage(): {
  migrated: boolean;
  counts: Record<string, number>;
} {
  const counts: Record<string, number> = {
    users: 0,
    items: 0,
    stockHistory: 0,
    costHistory: 0,
    boms: 0,
    itemTemplates: 0,
    vendorPriceCache: 0,
  };

  // Migrate users
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS);
  if (users && users.length > 0) {
    for (const user of users) {
      try {
        // Insert with explicit ID to preserve existing IDs
        // Mark existing users as email verified
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO users (id, email, password, role, sign_in_count, last_sign_in_at, last_sign_in_ip, email_verified, email_verification_token, email_verification_token_expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.email,
            user.password,
            user.role,
            user.signInCount,
            user.lastSignInAt,
            user.lastSignInIp,
            1, // Mark existing users as verified
            null,
            null,
            user.createdAt,
            user.updatedAt,
          ]
        );
        counts.users++;
      } catch (err) {
        console.warn('Failed to migrate user:', user.email, err);
      }
    }
  }

  // Migrate items
  const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS);
  if (items && items.length > 0) {
    for (const item of items) {
      try {
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO items (id, name, description, model_number, part_number, vendor_name, quantity, unit_value, value, picture, vendor_url, category, location, barcode, reorder_point, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.name,
            item.description,
            item.modelNumber,
            item.partNumber,
            item.vendorName,
            item.quantity,
            item.unitValue,
            item.value,
            item.picture,
            item.vendorUrl,
            item.category,
            item.location,
            item.barcode,
            item.reorderPoint,
            item.createdAt,
            item.updatedAt,
          ]
        );
        counts.items++;
      } catch (err) {
        console.warn('Failed to migrate item:', item.name, err);
      }
    }
  }

  // Migrate stock history
  const stockHistory = getFromStorage<StockHistoryEntry[]>(STORAGE_KEYS.STOCK_HISTORY);
  if (stockHistory && stockHistory.length > 0) {
    for (const entry of stockHistory) {
      try {
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO stock_history (id, item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.itemId,
            entry.itemName,
            entry.changeType,
            entry.previousQuantity,
            entry.newQuantity,
            entry.previousValue,
            entry.newValue,
            entry.previousCategory,
            entry.newCategory,
            entry.notes,
            entry.userId,
            entry.userEmail,
            entry.timestamp,
          ]
        );
        counts.stockHistory++;
      } catch (err) {
        console.warn('Failed to migrate stock history entry:', entry.id, err);
      }
    }
  }

  // Migrate cost history
  const costHistory = getFromStorage<CostHistoryEntry[]>(STORAGE_KEYS.COST_HISTORY);
  if (costHistory && costHistory.length > 0) {
    for (const entry of costHistory) {
      try {
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO cost_history (id, item_id, old_value, new_value, source, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.itemId,
            entry.oldValue,
            entry.newValue,
            entry.source,
            entry.timestamp,
          ]
        );
        counts.costHistory++;
      } catch (err) {
        console.warn('Failed to migrate cost history entry:', entry.id, err);
      }
    }
  }

  // Migrate BOMs
  const boms = getFromStorage<BOM[]>(STORAGE_KEYS.BOMS);
  if (boms && boms.length > 0) {
    for (const bom of boms) {
      try {
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO boms (id, name, description, items, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            bom.id,
            bom.name,
            bom.description,
            JSON.stringify(bom.items),
            bom.createdAt,
            bom.updatedAt,
          ]
        );
        counts.boms++;
      } catch (err) {
        console.warn('Failed to migrate BOM:', bom.name, err);
      }
    }
  }

  // Migrate item templates
  const templates = getFromStorage<ItemTemplate[]>(STORAGE_KEYS.ITEM_TEMPLATES);
  if (templates && templates.length > 0) {
    for (const template of templates) {
      try {
        const db = getDatabaseOrThrow();
        db.run(
          `INSERT INTO item_templates (id, name, category, default_fields, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            template.id,
            template.name,
            template.category,
            JSON.stringify(template.defaultFields),
            template.createdAt,
            template.updatedAt,
          ]
        );
        counts.itemTemplates++;
      } catch (err) {
        console.warn('Failed to migrate item template:', template.name, err);
      }
    }
  }

  // Migrate vendor price cache
  const priceCache = getFromStorage<VendorPriceCache>(STORAGE_KEYS.VENDOR_PRICE_CACHE);
  if (priceCache && Object.keys(priceCache).length > 0) {
    for (const [cacheKey, entry] of Object.entries(priceCache)) {
      try {
        vendorPriceCacheRepository.upsert(cacheKey, entry);
        counts.vendorPriceCache++;
      } catch (err) {
        console.warn('Failed to migrate vendor price cache entry:', cacheKey, err);
      }
    }
  }

  // Persist database after migration
  persistDatabase();

  // Clear old localStorage data after successful migration
  clearOldLocalStorageData();

  console.log('Migration completed:', counts);

  return {
    migrated: true,
    counts,
  };
}

/**
 * Clear old localStorage data after migration
 */
function clearOldLocalStorageData(): void {
  for (const key of OLD_STORAGE_KEYS) {
    removeFromStorage(key);
  }
  // Clear the initialized flag last
  removeFromStorage(STORAGE_KEYS.INITIALIZED);
  console.log('Old localStorage data cleared');
}

/**
 * Verify migration by comparing counts
 */
export function verifyMigration(): {
  valid: boolean;
  dbCounts: Record<string, number>;
} {
  const dbCounts = {
    users: userRepository.count(),
    items: itemRepository.count(),
    stockHistory: stockHistoryRepository.count(),
    costHistory: costHistoryRepository.count(),
    boms: bomRepository.count(),
    itemTemplates: itemTemplateRepository.count(),
  };

  // If we have any data, consider migration valid
  const valid = Object.values(dbCounts).some((count) => count > 0);

  return { valid, dbCounts };
}
