/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const projectId = 'demo-ak-producciones';
let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

test('denies unauthenticated client reads', async () => {
  const firestore = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(firestore, 'customers', 'customer-1')));
});

test('denies authenticated client reads', async () => {
  const firestore = testEnvironment.authenticatedContext('employee-1', {
    role: 'admin',
  }).firestore();

  await assertFails(getDoc(doc(firestore, 'customers', 'customer-1')));
});

test('denies authenticated client writes', async () => {
  const firestore = testEnvironment.authenticatedContext('employee-1', {
    role: 'admin',
  }).firestore();

  await assertFails(setDoc(doc(firestore, 'customers', 'customer-1'), {
    name: 'Test Customer',
  }));
});

test('allows trusted server-style setup with rules disabled', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await assertSucceeds(setDoc(doc(context.firestore(), 'customers', 'customer-1'), {
      name: 'Test Customer',
    }));
  });
});
