import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication helpers for AK Producciones E2E tests.
 *
 * The app uses a simple shared-password system.
 * Session key: ak_producciones_auth_session
 * A session is active when this key has any truthy value in localStorage/sessionStorage.
 */

export const SESSION_KEY = 'ak_producciones_auth_session';

/**
 * Inject a valid auth session via addInitScript so it runs before every page load.
 * Sets the session key in both localStorage and sessionStorage.
 *
 * Usage: call this right after creating a browser context, before any page.goto().
 */
export async function injectAuthSession(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ({ key }: { key: string }) => {
      try { window.localStorage.setItem(key, 'true'); } catch (e) { console.warn('[E2E] localStorage unavailable:', e); }
      try { window.sessionStorage.setItem(key, 'true'); } catch (e) { console.warn('[E2E] sessionStorage unavailable:', e); }
    },
    { key: SESSION_KEY },
  );
}

/**
 * Log in through the actual login UI.
 * Use this when you want to test the login flow itself.
 *
 * Reads the password from environment variable:
 *   E2E_DEMO_PASSWORD (required)
 */
export async function loginAsDemo(page: Page): Promise<void> {
  const password = process.env.E2E_DEMO_PASSWORD;
  if (!password) {
    throw new Error(
      'E2E_DEMO_PASSWORD environment variable is not set. ' +
        'Set it before running login tests (e.g. E2E_DEMO_PASSWORD=your_password npm run test:e2e).'
    );
  }

  await page.goto('/login');
  await page.waitForSelector('[data-testid="login-password"]');
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-submit"]');

  // Wait for redirect to home after successful login
  await page.waitForURL('/', { timeout: 10_000 });
}

/**
 * Set the auth session directly in sessionStorage on an already-loaded page.
 * Useful after navigation when addInitScript wasn't set up.
 */
export async function setAuthSession(page: Page): Promise<void> {
  await page.evaluate(
    ({ key }: { key: string }) => {
      try { window.localStorage.setItem(key, 'true'); } catch (e) { console.warn('[E2E] localStorage unavailable:', e); }
      try { window.sessionStorage.setItem(key, 'true'); } catch (e) { console.warn('[E2E] sessionStorage unavailable:', e); }
    },
    { key: SESSION_KEY },
  );
}

