import '@testing-library/jest-dom/vitest';

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => '123e4567-e89b-42d3-a456-426614174099' },
  configurable: true,
});
