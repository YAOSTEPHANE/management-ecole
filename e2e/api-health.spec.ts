import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:5000';

test.describe('API — santé', () => {
  test('GET /api/health renvoie OK', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({
      status: 'OK',
      message: expect.stringContaining('School Manager'),
    });
  });
});
