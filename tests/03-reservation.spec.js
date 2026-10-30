const { test, expect } = require('@playwright/test');

// MISSION 3 — Reservation tests.
test('invalid email blocks reservation', async ({ page }) => {
  const reservationPosts = [];
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/api/reservations')) {
      reservationPosts.push(request);
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('station-card')).toHaveCount(4);

  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('not-an-email');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('');
  expect(reservationPosts).toHaveLength(0);
});

test('reservation sends correct payload and confirms booking', async ({ page }) => {
  let capturedPayload = null;

  await page.route('**/api/reservations', async route => {
    capturedPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ reservationId: 'CB-DEMO-777', stationId: 'central' })
    });
  });

  await page.goto('/');
  await expect(page.getByTestId('station-card')).toHaveCount(4);

  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await expect(page.getByText('Selected station: Central Square')).toBeVisible();
  await page.getByRole('textbox', { name: 'Email address' }).fill('student@example.com');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByRole('status')).toHaveText('Reservation confirmed: CB-DEMO-777');

  expect(capturedPayload).toEqual({ stationId: 'central', email: 'student@example.com' });
});
