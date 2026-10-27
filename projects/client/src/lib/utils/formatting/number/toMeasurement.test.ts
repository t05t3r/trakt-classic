import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toMeasurement } from './toMeasurement.ts';

describe('toMeasurement', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'en-US' });
  });

  describe('metric regions', () => {
    it('should format meters for metric locale (en-NL)', () => {
      vi.stubGlobal('navigator', { language: 'en-NL' });
      const result = toMeasurement(1.75, 'en-NL');
      expect(result).toMatch(/1,75\s*m/);
    });

    it('should format meters for de-DE', () => {
      vi.stubGlobal('navigator', { language: 'de-DE' });
      const result = toMeasurement(1.75, 'de-DE');
      expect(result).toMatch(/1,75\s*m/);
    });

    it('should use navigator language for metric system detection, not locale param', () => {
      vi.stubGlobal('navigator', { language: 'en-NL' });
      const result = toMeasurement(1.75, 'en-US');
      expect(result).toMatch(/1.75\s*m/);
    });
  });

  describe('imperial regions', () => {
    it('should convert meters to feet for US locale', () => {
      vi.stubGlobal('navigator', { language: 'en-US' });
      const result = toMeasurement(1.75, 'en-US');
      expect(result).toContain('5.74');
      expect(result).toContain('ft');
    });

    it('should convert meters to feet for Liberia', () => {
      vi.stubGlobal('navigator', { language: 'en-LR' });
      const result = toMeasurement(1.75, 'en-LR');
      expect(result).toContain('5.74');
      expect(result).toContain('ft');
    });

    it('should convert meters to feet for Myanmar', () => {
      vi.stubGlobal('navigator', { language: 'my-MM' });
      const result = toMeasurement(1.75, 'en-US');
      expect(result).toContain('5.74');
      expect(result).toContain('ft');
    });
  });

  describe('edge cases', () => {
    it('should handle zero meters', () => {
      vi.stubGlobal('navigator', { language: 'en-US' });
      const result = toMeasurement(0, 'en-US');
      expect(result).toBeDefined();
    });

    it('should handle small decimal values', () => {
      vi.stubGlobal('navigator', { language: 'en-NL' });
      const result = toMeasurement(0.15, 'en-NL');
      expect(result).toMatch(/0,15\s*m/);
    });

    it('should respect maximumFractionDigits of 2', () => {
      vi.stubGlobal('navigator', { language: 'en-NL' });
      const result = toMeasurement(1.2567, 'en-NL');
      expect(result).toMatch(/1,26\s*m/);
    });
  });
});
