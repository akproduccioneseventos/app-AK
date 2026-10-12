/** @jest-environment node */
let fallaConsulta = false;
let filas: any[] = [];
let hayBase = true;
let disponible = true;
let omitirBuild = false;

jest.mock('@/lib/logger', () => ({
  shouldSkipFirestoreDuringBuild: () => omitirBuild,
  isBuildTime: () => false,
  isDefaultCredentialError: () => false,
  compactError: (error: unknown) => error,
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({ isFirebaseAvailable: () => disponible }));
jest.mock('@/lib/firebase/server', () => {
  const consulta: any = {
    where: () => consulta,
    limit: () => consulta,
    get: jest.fn(async () => {
      if (fallaConsulta) throw new Error('base interrumpida');
      return { empty: filas.length === 0, docs: filas.map(data => ({ data: () => ({ ...data }) })) };
    }),
  };
  return { get dbAdmin() { return hayBase ? { collection: () => consulta } : null; } };
});
jest.mock('fs/promises', () => ({ readdir: jest.fn(async () => []) }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), writeData: jest.fn(), updateDataPartial: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermiso: jest.fn(), requirePermisoAlguno: jest.fn() }));
jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({ usuarioDelEquipo: async () => true, quienEsElEquipo: async () => () => true }));

import { listCollectionFromFirestore } from '@/lib/firebase-sync';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import { getOcupiedDates } from '@/app/actions/agenda';
import fs from 'fs/promises';

const modoAnterior = process.env.AK_USE_LOCAL_JSON_ONLY;
beforeEach(() => {
  fallaConsulta = false; filas = []; hayBase = true; disponible = true; omitirBuild = false;
  process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => {
  if (modoAnterior === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
  else process.env.AK_USE_LOCAL_JSON_ONLY = modoAnterior;
});

it('la falla de Query.get llega al portal real y al calendario real', async () => {
  fallaConsulta = true;
  await expect(getFiestaByAccessKey('clave-valida')).rejects.toThrow('base interrumpida');
  await expect(getOcupiedDates()).rejects.toThrow('base interrumpida');
  expect(fs.readdir).not.toHaveBeenCalled();
});

it('una base realmente vacia conserva null y []', async () => {
  await expect(getFiestaByAccessKey('clave-inexistente')).resolves.toBeNull();
  await expect(getOcupiedDates()).resolves.toEqual([]);
});

it('la lectura se recupera sin cambiar datos ni ocultar la fecha', async () => {
  filas = [{ id: 'f1', estado: 'confirmado', configuracion: { fechaEvento: '2027-08-08' }, clientPortalSettings: { enabled: true, accessKey: 'clave-valida' } }];
  const antes = JSON.stringify(filas);
  fallaConsulta = true;
  await expect(leerFiestasCrudas(false)).rejects.toThrow('base interrumpida');
  fallaConsulta = false;
  await expect(getFiestaByAccessKey('clave-valida')).resolves.toMatchObject({ id: 'f1' });
  await expect(getOcupiedDates()).resolves.toEqual(['2027-08-08']);
  expect(JSON.stringify(filas)).toBe(antes);
});

it('el lector compartido mantiene compatibilidad por defecto y exige error solo al pedirlo', async () => {
  fallaConsulta = true;
  await expect(listCollectionFromFirestore('fiestas')).resolves.toEqual([]);
  await expect(listCollectionFromFirestore('fiestas', { throwOnError: true })).rejects.toThrow('base interrumpida');
});

it.each(['build', 'sin-base', 'json-local', 'firebase-no-configurado'])('conserva el modo intencional %s', async modo => {
  fallaConsulta = true;
  if (modo === 'build') omitirBuild = true;
  if (modo === 'sin-base') hayBase = false;
  if (modo === 'json-local') process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  if (modo === 'firebase-no-configurado') disponible = false;
  await expect(leerFiestasCrudas(false)).resolves.toEqual([]);
});
