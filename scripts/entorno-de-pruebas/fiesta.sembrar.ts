import fs from 'node:fs';
import { test } from '@playwright/test';
import { archivosDe, crearFiestaDeEstaNoche, crearPermisoDeEstacion } from '../../tests/e2e/helpers/fiesta-de-prueba';

/**
 * La fiesta del entorno aislado: la misma "fiesta de esta noche" de las pruebas de navegador
 * (80 invitados, todos los módulos, portal del cliente abierto), con enlaces para cada rol.
 * El prefijo `e2e_` hace que `npm run limpiar:corrida` y las pruebas la reconozcan como de prueba.
 */
test('sembrar la fiesta del entorno aislado', () => {
  const salida = process.env.AK_ENTORNO_SALIDA;
  if (!salida || process.env.AK_ENTORNO_AISLADO !== 'true') {
    throw new Error('Esto sólo corre dentro de `npm run entorno:pruebas`.');
  }
  const fiesta = crearFiestaDeEstaNoche({ id: 'e2e_entorno_aislado', clavePortal: 'clave-portal-aislado' });
  const estaciones: Array<[string, string, string]> = [
    ['Fotocabina', 'fotocabina', 'fotocabina'],
    ['Cabina con IA', 'espejoMagicoIA', 'touchpix'],
    ['Plataforma 360', 'plataforma360', 'plataforma-360'],
    ['Bogue', 'bogue', 'bogue'],
  ];
  fs.writeFileSync(salida, JSON.stringify({
    fiestaId: fiesta.id,
    clavePortal: fiesta.clientPortalSettings?.accessKey,
    archivos: archivosDe(fiesta.id),
    invitados: (fiesta.invitados ?? []).slice(0, 3).map((i: any) => ({
      nombre: i.nombre,
      ruta: `/invitacion/${fiesta.id}/invitado/${i.id}?token=${i.guestAccessToken}`,
    })),
    estaciones: [
      ...estaciones.map(([nombre, modulo, ruta]) => ({
        nombre,
        ruta: `/evento/${ruta}/${fiesta.id}?access=${crearPermisoDeEstacion(fiesta.id, modulo)}`,
      })),
      // La barra no es una estación con permiso propio: la pantalla del invitado es pública y la
      // del barman pide la sesión del equipo (entrar antes por /login).
      { nombre: 'Barra (pantalla del invitado)', ruta: `/evento/barra/${fiesta.id}` },
      { nombre: 'Barra (barman, con sesión del equipo)', ruta: `/evento/barra/${fiesta.id}/barman` },
    ],
  }, null, 2));
});
