import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupPrice, compareVendorPrices, clearPriceCache, getSupportedVendors, isVendorSupported } from './vendorService';

describe('vendorService', () => {
  beforeEach(() => {
    clearPriceCache();
    vi.useRealTimers();
  });

  describe('lookupPrice', () => {
    it('returns price result for supported vendor', async () => {
      vi.useFakeTimers();
      const promise = lookupPrice('Adafruit', '50');
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).not.toBeNull();
      expect(result!.vendor).toBe('Adafruit');
      expect(result!.partNumber).toBe('50');
      expect(typeof result!.price).toBe('number');
      expect(typeof result!.inStock).toBe('boolean');
      expect(result!.vendorUrl).toContain('adafruit.com');
    });

    it('returns null for unsupported vendor', async () => {
      vi.useFakeTimers();
      const promise = lookupPrice('UnknownVendor', '50');
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBeNull();
    });

    it('returns cached result on second call', async () => {
      vi.useFakeTimers();
      const p1 = lookupPrice('Adafruit', '50');
      vi.advanceTimersByTime(2000);
      const first = await p1;

      const p2 = lookupPrice('Adafruit', '50');
      vi.advanceTimersByTime(2000);
      const second = await p2;

      expect(first).toEqual(second);
    });
  });

  describe('compareVendorPrices', () => {
    it('returns results sorted by price ascending', async () => {
      vi.useFakeTimers();
      const promise = compareVendorPrices('100');

      // Advance timers repeatedly to resolve each sequential lookupPrice call
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(2000);
      }

      const results = await promise;

      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].price).toBeGreaterThanOrEqual(results[i - 1].price);
      }
    });
  });

  describe('getSupportedVendors', () => {
    it('returns array of vendor names', () => {
      const vendors = getSupportedVendors();
      expect(vendors.length).toBeGreaterThan(0);
      expect(vendors).toContain('Adafruit');
    });
  });

  describe('isVendorSupported', () => {
    it('returns true for supported vendor name', () => {
      expect(isVendorSupported('Adafruit')).toBe(true);
    });

    it('returns true for supported vendor ID', () => {
      expect(isVendorSupported('adafruit')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isVendorSupported('ADAFRUIT')).toBe(true);
    });

    it('returns false for unsupported vendor', () => {
      expect(isVendorSupported('FakeVendor')).toBe(false);
    });
  });

  describe('clearPriceCache', () => {
    it('clears cached results', async () => {
      vi.useFakeTimers();
      const p1 = lookupPrice('Adafruit', '50');
      vi.advanceTimersByTime(2000);
      await p1;

      clearPriceCache();

      // After clearing, the next call should go through the mock delay again
      const p2 = lookupPrice('Adafruit', '50');
      vi.advanceTimersByTime(2000);
      const result = await p2;
      expect(result).not.toBeNull();
    });
  });
});
