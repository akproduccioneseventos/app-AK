import { test as base, expect, type Page } from '@playwright/test';
import { injectAuthSession } from './helpers/auth';

/**
 * Custom Playwright fixtures for AK Producciones E2E tests.
 *
 * Provides an `authPage` fixture: a Page with the auth session already injected,
 * so tests start authenticated without going through the login UI.
 */
type AKFixtures = {
  /** A page with a valid auth session pre-injected via sessionStorage. */
  authPage: Page;
};

export const test = base.extend<AKFixtures>({
  authPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    // Inject auth session before any navigation so AuthGuard passes
    await injectAuthSession(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
