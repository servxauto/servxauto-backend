import { randomInt } from 'crypto';

/**
 * Generates a random numeric code of `n` digits (e.g. OTPs).
 * Uses a cryptographically secure source of randomness.
 */
export function generateRandomCode(n: number): number {
  const min = 10 ** (n - 1);
  const max = 10 ** n;
  return randomInt(min, max);
}

/**
 * Adds a specified number of minutes to a date (defaults to current time).
 */
export function addMinutes(minutes: number, date: Date = new Date()): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Generates a URL-friendly slug from text.
 */
export function slugifyText(...args: string[]): string {
  return args
    .join(' ')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts RGB color values to HEX format.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}
