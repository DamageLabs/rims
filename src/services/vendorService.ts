import { VendorPriceResult, SUPPORTED_VENDORS } from '../types/Vendor';

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const priceCache = new Map<string, VendorPriceResult>();

function getCacheKey(vendor: string, partNumber: string): string {
  return `${vendor.toLowerCase()}-${partNumber.toLowerCase()}`;
}

function isCacheValid(entry: VendorPriceResult): boolean {
  const lastChecked = new Date(entry.lastChecked).getTime();
  return Date.now() - lastChecked < CACHE_DURATION_MS;
}

function mockPriceLookup(vendor: string, partNumber: string): VendorPriceResult | null {
  const vendorLower = vendor.toLowerCase();
  const supportedVendor = SUPPORTED_VENDORS.find(
    (v) => v.name.toLowerCase() === vendorLower || v.id === vendorLower
  );

  if (!supportedVendor) {
    return null;
  }

  const hash = partNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = (hash % 100) + 0.99;
  const inStock = hash % 3 !== 0;
  const stockQty = inStock ? (hash % 500) + 1 : 0;

  return {
    vendor: supportedVendor.name,
    partNumber,
    price: Math.round(basePrice * 100) / 100,
    inStock,
    stockQuantity: stockQty,
    vendorUrl: `${supportedVendor.baseUrl}/product/${encodeURIComponent(partNumber)}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function lookupPrice(vendor: string, partNumber: string): Promise<VendorPriceResult | null> {
  const cacheKey = getCacheKey(vendor, partNumber);

  const cached = priceCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached;
  }

  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  const result = mockPriceLookup(vendor, partNumber);
  if (result) {
    priceCache.set(cacheKey, result);
  }

  return result;
}

export async function compareVendorPrices(partNumber: string): Promise<VendorPriceResult[]> {
  const results: VendorPriceResult[] = [];

  for (const vendor of SUPPORTED_VENDORS) {
    const result = await lookupPrice(vendor.name, partNumber);
    if (result) {
      results.push(result);
    }
  }

  return results.sort((a, b) => a.price - b.price);
}

export function clearPriceCache(): void {
  priceCache.clear();
}

export function getSupportedVendors(): string[] {
  return SUPPORTED_VENDORS.map((v) => v.name);
}

export function isVendorSupported(vendor: string): boolean {
  const vendorLower = vendor.toLowerCase();
  return SUPPORTED_VENDORS.some(
    (v) => v.name.toLowerCase() === vendorLower || v.id === vendorLower
  );
}
