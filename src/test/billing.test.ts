/**
 * Girls Bar Fairy - Billing Calculation Tests
 * Tests for rounding and extension preview logic
 */

import { describe, it, expect } from 'vitest';
import {
  floorToNearest10,
  applyTaxServiceAndRound,
  calculateExtensionPreview,
  formatJPY,
  formatStartTime,
  formatMinutes,
} from '@/types/billing';

describe('floorToNearest10', () => {
  it('should floor 18523 to 18520', () => {
    expect(floorToNearest10(18523)).toBe(18520);
  });

  it('should floor 18529 to 18520', () => {
    expect(floorToNearest10(18529)).toBe(18520);
  });

  it('should keep 18500 as 18500', () => {
    expect(floorToNearest10(18500)).toBe(18500);
  });

  it('should floor 99 to 90', () => {
    expect(floorToNearest10(99)).toBe(90);
  });

  it('should floor 5 to 0', () => {
    expect(floorToNearest10(5)).toBe(0);
  });

  it('should handle zero', () => {
    expect(floorToNearest10(0)).toBe(0);
  });

  it('should floor decimals correctly', () => {
    // 29269.999999... should floor to 29260
    expect(floorToNearest10(29269.999999)).toBe(29260);
  });
});

describe('applyTaxServiceAndRound', () => {
  it('should apply 1.20 multiplier and floor to nearest 10', () => {
    // Base: 10000, with tax/service: 12000, floored: 12000
    expect(applyTaxServiceAndRound(10000)).toBe(12000);
  });

  it('should handle amounts that need rounding after multiplier', () => {
    // Base: 15416, with tax/service: 18499.2, floored: 18490
    expect(applyTaxServiceAndRound(15416)).toBe(18490);
  });

  it('should handle the spec example for current_total', () => {
    // If current_total should be 18500, base would be ~15416.67
    // 15416.67 * 1.20 = 18500.004, floored = 18500
    const baseForTotal = 15416.67;
    expect(applyTaxServiceAndRound(baseForTotal)).toBe(18500);
  });

  it('should handle small amounts', () => {
    // Base: 100, with tax/service: 120, floored: 120
    expect(applyTaxServiceAndRound(100)).toBe(120);
  });

  it('should handle amounts that result in exact tens', () => {
    // Base: 5000, with tax/service: 6000, floored: 6000
    expect(applyTaxServiceAndRound(5000)).toBe(6000);
  });
});

describe('calculateExtensionPreview', () => {
  it('should add extension price and apply tax/service then floor', () => {
    // Current base: 15416.67 (gives 18500 after tax/service)
    // Extension: 3000
    // Total base: 18416.67
    // With tax/service: 22100.004
    // Floored: 22100
    const currentBase = 15416.67;
    const extensionPrice = 3000;
    expect(calculateExtensionPreview(currentBase, extensionPrice)).toBe(22100);
  });

  it('should calculate extension for demo scenario', () => {
    // From spec: current_total 18500, extension_preview_total 21500
    // To get 21500: need base of ~17916.67
    // If current base is ~15416.67 and extension is 2500
    // 15416.67 + 2500 = 17916.67
    // 17916.67 * 1.20 = 21500.004, floored = 21500
    const currentBase = 15416.67;
    const extensionPrice = 2500;
    expect(calculateExtensionPreview(currentBase, extensionPrice)).toBe(21500);
  });

  it('should handle 40min extension at ¥3,000', () => {
    // Base: 10000
    // Extension: 3000 (40min at ¥3,000)
    // Total base: 13000
    // With tax/service: 15600
    // Floored: 15600
    expect(calculateExtensionPreview(10000, 3000)).toBe(15600);
  });
});

describe('formatJPY', () => {
  it('should format 18500 as ¥18,500', () => {
    expect(formatJPY(18500)).toBe('¥18,500');
  });

  it('should format 100 as ¥100', () => {
    expect(formatJPY(100)).toBe('¥100');
  });

  it('should format 1234567 as ¥1,234,567', () => {
    expect(formatJPY(1234567)).toBe('¥1,234,567');
  });

  it('should format 0 as ¥0', () => {
    expect(formatJPY(0)).toBe('¥0');
  });
});

describe('formatStartTime', () => {
  it('should format ISO date to HH:MM', () => {
    const isoDate = '2026-02-03T21:00:00+09:00';
    const result = formatStartTime(isoDate);
    // Should be 21:00 in JST (or equivalent local time)
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatMinutes', () => {
  it('should format 152 as "152分"', () => {
    expect(formatMinutes(152)).toBe('152分');
  });

  it('should format 0 as "0分"', () => {
    expect(formatMinutes(0)).toBe('0分');
  });

  it('should format 5 as "5分"', () => {
    expect(formatMinutes(5)).toBe('5分');
  });
});

describe('Payroll calculation example from spec', () => {
  it('should calculate final payout correctly', () => {
    const hourlyRate = 4000;
    const minutesWorked = 392;
    const tips = 7500;
    const welfareFee = 1000;
    
    // Step 1: base = 4000 × (392 ÷ 60) = 26,133.333...
    const base = hourlyRate * (minutesWorked / 60);
    expect(base).toBeCloseTo(26133.333, 2);
    
    // Step 2: sum = base + tips = 33,633.333...
    const sum = base + tips;
    expect(sum).toBeCloseTo(33633.333, 2);
    
    // Step 3: after-tax = sum × 0.9 = 30,269.999...
    const afterTax = sum * 0.9;
    expect(afterTax).toBeCloseTo(30270, 0);
    
    // Step 4: subtract welfare = 29,269.999...
    const afterDeductions = afterTax - welfareFee;
    expect(afterDeductions).toBeCloseTo(29270, 0);
    
    // Step 5: floor to nearest 10 = 29,260
    // Note: Due to floating point, actual value is 29269.999...
    // which floors to 29260
    const finalPayout = floorToNearest10(afterDeductions);
    expect(finalPayout).toBe(29260);
  });
});
