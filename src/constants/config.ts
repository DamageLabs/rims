// Application configuration constants

export const APP_NAME = 'RIMS';
export const APP_DESCRIPTION = 'React Inventory Management System';

// Pagination
export const ITEMS_PER_PAGE = 25;

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 5;

// Inventory types where low stock / reorder alerts apply
export const LOW_STOCK_TYPE_NAMES = ['Electronics', 'Ammunition'];

// Theme
export const THEME_STORAGE_KEY = 'rims-theme';
export type Theme = 'light' | 'dark';
export const DEFAULT_THEME: Theme = 'light';
