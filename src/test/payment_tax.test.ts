/**
 * Payment & Tax Tests
 * Verifies card tax calculation, payment method checks, and negative time formatting
 */

import { describe, it, expect } from 'vitest';
import {
    ceilToNearest100,
    calculateCardTaxAmount,
    isCardTaxApplicable,
    formatMinutes,
    type PaymentMethod
} from '@/types/billing';

describe('ceilToNearest100', () => {
    it('should ceil 18150 to 18200', () => {
        expect(ceilToNearest100(18150)).toBe(18200);
    });

    it('should ceil 18101 to 18200', () => {
        expect(ceilToNearest100(18101)).toBe(18200);
    });

    it('should keep 18100 as 18100', () => {
        expect(ceilToNearest100(18100)).toBe(18100);
    });

    it('should ceil 50 to 100', () => {
        expect(ceilToNearest100(50)).toBe(100);
    });
});

describe('calculateCardTaxAmount', () => {
    it('should apply 10% surcharge and round up to nearest 100', () => {
        // 16500 * 1.1 = 18150 -> 18200
        expect(calculateCardTaxAmount(16500)).toBe(18200);
    });

    it('should handle small amounts', () => {
        // 1000 * 1.1 = 1100 -> 1100
        expect(calculateCardTaxAmount(1000)).toBe(1100);
    });

    it('should handle decimal results', () => {
        // 100 * 1.1 = 110 -> 200 (wait, 110 ceil to 100 is 200? No, 110 rounds to 200. 110/100 = 1.1 -> ceil 2 -> 200)
        expect(calculateCardTaxAmount(100)).toBe(200);

        // Let's check manual math: 100 * 1.1 = 110. ceil(1.1) * 100 = 2 * 100 = 200. Correct.
    });
});

describe('isCardTaxApplicable', () => {
    it('should be true for card', () => {
        expect(isCardTaxApplicable('card')).toBe(true);
    });

    it('should be true for qr', () => {
        expect(isCardTaxApplicable('qr')).toBe(true);
    });

    it('should be true for contactless', () => {
        expect(isCardTaxApplicable('contactless')).toBe(true);
    });

    it('should be true for split', () => {
        expect(isCardTaxApplicable('split')).toBe(true);
    });

    it('should be false for cash', () => {
        expect(isCardTaxApplicable('cash')).toBe(false);
    });

    it('should be false for null/undefined', () => {
        expect(isCardTaxApplicable(null)).toBe(false);
        expect(isCardTaxApplicable(undefined)).toBe(false);
    });
});

describe('formatMinutes (negative time)', () => {
    it('should format positive minutes normally', () => {
        expect(formatMinutes(10)).toBe('10分');
        expect(formatMinutes(0)).toBe('0分');
    });

    it('should format negative minutes with minus sign', () => {
        expect(formatMinutes(-10)).toBe('-10分');
        expect(formatMinutes(-1)).toBe('-1分');
        expect(formatMinutes(-59)).toBe('-59分');
    });
});
