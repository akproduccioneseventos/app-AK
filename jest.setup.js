
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
  global.clearImmediate = (id) => clearTimeout(id);
}

// Enable write actions in tests by default so executor tests pass.
// Safe-mode tests explicitly override this in their own beforeEach/afterEach.
process.env.ASSISTANT_WRITE_ACTIONS_ENABLED = 'true';
