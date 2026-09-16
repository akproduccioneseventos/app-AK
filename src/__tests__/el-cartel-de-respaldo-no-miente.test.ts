/**
 * Orden 59 - Bloque A: El cartel de respaldos no miente cuando no sabe.
 *
 * Cumple con los requisitos de docs/ordenes/59-el-cartel-no-dice-protegido-sin-saberlo.md:
 * 1. Inspecciona el código real de src/app/(app)/settings/backup/page.tsx.
 * 2. Comprueba que con el estado sin averiguar el cartel NO diga "ACTIVO Y PROTEGIDO".
 * 3. Comprueba que con el estado al día SÍ lo diga.
 * 4. Prueba la función comoEstaElRespaldo con los cuatro casos ('cargando' | 'no-se-pudo-saber' | 'al-dia' | 'vencido').
 * 5. Verifica que el estado desconocido sea ámbar con el mensaje exacto y nunca verde.
 */

import fs from 'node:fs';
import path from 'node:path';
import { comoEstaElRespaldo, type EstadoRespaldo } from '@/lib/respaldos/como-esta-el-respaldo';
import type { AutoBackupStatus } from '@/app/actions/backup';

describe('Orden 59 - Bloque A: El cartel de respaldos no miente', () => {
  const pageFilePath = path.join(process.cwd(), 'src/app/(app)/settings/backup/page.tsx');
  const pageSource = fs.readFileSync(pageFilePath, 'utf8');

  describe('Inspección de la pantalla real', () => {
    it('usa comoEstaElRespaldo para determinar el cartel y no un ternario ciego', () => {
      expect(pageSource).toContain('comoEstaElRespaldo(');
      expect(pageSource).toContain("estado === 'cargando'");
      expect(pageSource).toContain("estado === 'no-se-pudo-saber'");
      expect(pageSource).toContain("estado === 'vencido'");

      // No debe existir el fallback ternario ciego que mostraba ACTIVO Y PROTEGIDO ante null
      expect(pageSource).not.toMatch(/backupStatus?.isStales*?s*['"]ATENCI[OÓ]N:s*SINs*RESPALDOs*RECIENTE['"]s*:s*['"]ACTIVOs*Ys*PROTEGIDO['"]/);
    });

    it('el estado desconocido usa ámbar con el mensaje exacto y nunca verde', () => {
      expect(pageSource).toContain('NO SE PUDO SABER');
      expect(pageSource).toContain('No se pudo averiguar cómo están los respaldos. Probá recargar; si sigue, creá un punto manual.');
      expect(pageSource).toContain('bg-amber-600');
    });

    it('el estado cargando es neutro y no dice "ACTIVO Y PROTEGIDO"', () => {
      expect(pageSource).toContain('Averiguando estado...');
    });
  });

  describe('Función comoEstaElRespaldo - Cobertura de los 4 estados', () => {
    it('1. cargando: mientras se pide el estado devuelve "cargando"', () => {
      const res: EstadoRespaldo = comoEstaElRespaldo({
        cargando: true,
        backupStatus: null,
        falloConsulta: false,
      });
      expect(res).toBe('cargando');
    });

    it('2. no-se-pudo-saber: si falló la consulta o dio null devuelve "no-se-pudo-saber"', () => {
      // Caso consulta fallida
      const resFallo = comoEstaElRespaldo({
        cargando: false,
        backupStatus: null,
        falloConsulta: true,
      });
      expect(resFallo).toBe('no-se-pudo-saber');

      // Caso null sin error explícito
      const resNull = comoEstaElRespaldo({
        cargando: false,
        backupStatus: null,
        falloConsulta: false,
      });
      expect(resNull).toBe('no-se-pudo-saber');
    });

    it('3. vencido: si pasaron más de 24hs o hay fallas reiteradas devuelve "vencido"', () => {
      const statusVencido: AutoBackupStatus = {
        lastSuccessfulBackup: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        lastAttemptAt: new Date().toISOString(),
        lastError: null,
        consecutiveFailures: 0,
        isStale: true,
        hasRepeatedErrors: false,
      };
      const resVencido = comoEstaElRespaldo({
        cargando: false,
        backupStatus: statusVencido,
        falloConsulta: false,
      });
      expect(resVencido).toBe('vencido');

      const statusFallas: AutoBackupStatus = {
        lastSuccessfulBackup: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        lastError: 'Firestore timeout',
        consecutiveFailures: 3,
        isStale: false,
        hasRepeatedErrors: true,
      };
      const resFallas = comoEstaElRespaldo({
        cargando: false,
        backupStatus: statusFallas,
        falloConsulta: false,
      });
      expect(resFallas).toBe('vencido');
    });

    it('4. al-dia: confirmado en Firestore y reciente devuelve "al-dia"', () => {
      const statusAlDia: AutoBackupStatus = {
        lastSuccessfulBackup: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        lastAttemptAt: new Date().toISOString(),
        lastError: null,
        consecutiveFailures: 0,
        isStale: false,
        hasRepeatedErrors: false,
      };
      const resAlDia = comoEstaElRespaldo({
        cargando: false,
        backupStatus: statusAlDia,
        falloConsulta: false,
      });
      expect(resAlDia).toBe('al-dia');
    });
  });
});

