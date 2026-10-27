import type { AvailableLanguage } from '$lib/features/i18n/index.ts';
import { describe, expect, it } from 'vitest';
import { toHumanCurrency } from './toHumanCurrency.ts';

describe('toHumanCurrency', () => {
  it('should display dollars', () => {
    const currencyParams = {
      price: 3.50,
      currency: 'usd',
      locale: 'en' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('$3.50');
  });

  it('should display euro', () => {
    const currencyParams = {
      price: 3.50,
      currency: 'eur',
      locale: 'en' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('€3.50');
  });

  it('should display dollars in a different locale', () => {
    const currencyParams = {
      price: 3.50,
      currency: 'usd',
      locale: 'nl' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('US$ 3,50');
  });

  it('should display euro in a different locale', () => {
    const currencyParams = {
      price: 3.50,
      currency: 'eur',
      locale: 'nl' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('€ 3,50');
  });

  it('should limit to max 2 decimals', () => {
    const currencyParams = {
      price: 6.789,
      currency: 'usd',
      locale: 'en' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('$6.79');
  });

  it('should omit decimals', () => {
    const currencyParams = {
      price: 6,
      currency: 'usd',
      locale: 'en' as AvailableLanguage,
    };

    expect(toHumanCurrency(currencyParams)).toBe('$6');
  });
});
