import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('sends GET request to correct URL', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 1 }) });

      await api.get('/items');

      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('returns parsed JSON on success', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([1, 2, 3]) });

      const result = await api.get('/items');

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('post', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });

      await api.post('/items', { name: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
    });

    it('sends POST without body when undefined', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await api.post('/items');

      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });
    });
  });

  describe('put', () => {
    it('sends PUT with JSON body', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });

      await api.put('/items/1', { name: 'Updated' });

      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: 'Deleted' }) });

      await api.delete('/items/1');

      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('error handling', () => {
    it('throws ApiError with error message from response body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Item not found' }),
      });

      await expect(api.get('/items/999')).rejects.toThrow(ApiError);
      await expect(api.get('/items/999')).rejects.toThrow('Item not found');
    });

    it('throws ApiError with statusText when body has no error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(api.get('/fail')).rejects.toThrow('Internal Server Error');
    });

    it('throws ApiError with statusText when body parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      });

      await expect(api.get('/fail')).rejects.toThrow('Internal Server Error');
    });

    it('ApiError has correct status property', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Access denied' }),
      });

      try {
        await api.get('/forbidden');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(403);
      }
    });
  });
});
