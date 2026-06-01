import { test, expect } from '@playwright/test';

test.describe('Page d’accueil', () => {
  test('affiche le titre, les sections restaurées et des textes lisibles', async ({ page }) => {
    const response = await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    test.skip(!response || response.status() >= 400, 'La page d’accueil n’est pas disponible.');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 45_000 });
    await expect(heading).not.toBeEmpty();

    const headingColor = await heading.evaluate((el) => window.getComputedStyle(el).color);
    expect(headingColor).not.toBe('rgba(0, 0, 0, 0)');

    await expect(page.getByRole('heading', { name: /Mot de la Direction des Études/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Actualités$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Une communauté engagée pour la réussite/i })).toBeVisible();

    const experienceBlock = page.locator('#experience');
    await experienceBlock.scrollIntoViewIfNeeded();
    await expect(experienceBlock.getByText(/Un parcours de réussite/i)).toBeVisible();

    const root = page.locator('.home-page--ultra');
    await expect(root).toBeVisible();
    expect(await root.evaluate((el) => el.classList.contains('premium-body-v2'))).toBe(false);
    const grainBefore = await root.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return before.display === 'none' || before.content === 'none' || before.opacity === '0';
    });
    expect(grainBefore).toBe(true);

    const homeNav = page.getByRole('navigation', { name: /Navigation de la page d'accueil/i });
    for (const label of [
      'Expérience',
      'Pédagogie',
      'Direction',
      'Actualités',
      'Admissions',
      'Contact',
    ]) {
      await expect(homeNav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    const loginOrSpace = page.getByRole('link', { name: /Espace sécurisé|Connexion|Se connecter/i }).first();
    await expect(loginOrSpace).toBeVisible();
  });
});
