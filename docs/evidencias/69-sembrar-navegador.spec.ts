import { test } from '@playwright/test';
import { crearFiestaDeEstaNoche } from '../../tests/e2e/helpers/fiesta-de-prueba';

test('fixture estable para recorrido manual aislado', () => {
  if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
    throw new Error('Only the isolated local audit may create this disposable fixture.');
  }
  // Different prefix: ordinary E2E cleanup must not erase this manual journey.
  const fiesta = crearFiestaDeEstaNoche({ id: 'ak_audit69_portal', clavePortal: 'clave-portal-aislado' });
  console.log(JSON.stringify({ id: fiesta.id, guests: fiesta.invitados?.length }));
});
