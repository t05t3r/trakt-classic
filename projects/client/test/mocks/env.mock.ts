import { vi } from 'vitest';

const mockEnv = new Proxy({}, {
  get: (_, variableName: string | symbol) => {
    if (typeof variableName !== 'string') return undefined;

    return `${variableName}-MOCK`;
  },
});

vi.mock('$env/dynamic/private', () => ({
  env: mockEnv,
}));

vi.mock('$env/dynamic/public', () => ({
  env: mockEnv,
}));
