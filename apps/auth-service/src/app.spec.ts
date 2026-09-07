import { getJakartaDateString } from '@attendance/common';

describe('auth-service smoke test', () => {
  it('resolves shared library via tsconfig paths', () => {
    const date = getJakartaDateString(new Date('2026-09-07T00:00:00.000Z'));
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
