import fs from 'node:fs';
import path from 'node:path';
import {
  evaluarComoVieneElRespaldo,
  evaluarInformeBackupFinal,
  buildBackupReadinessReport,
} from '@/lib/backup/backup-health';

describe('Orden 286 — Bloque 1: Control de backup mira si anda', () => {
  const pagePath = path.join(process.cwd(), 'src/app/(app)/settings/backup-final/page.tsx');
  const pageSource = fs.readFileSync(pagePath, 'utf8');

  it('la pantalla separa en "Qué cubre el respaldo" y "Cómo viene el respaldo", y usa getBackupStatus', () => {
    expect(pageSource).toContain('Qué cubre el respaldo');
    expect(pageSource).toContain('Cómo viene el respaldo');
    expect(pageSource).toContain('getBackupStatus');
  });

  it('con estado consecutiveFailures: 5 y última copia de hace 30 días, el informe no da "Listo" y trae el motivo', () => {
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const informe = evaluarInformeBackupFinal({
      status: {
        lastSuccessfulBackup: hace30Dias,
        consecutiveFailures: 5,
        lastError: 'Firestore timeout de lectura tras 45s',
      },
    });

    expect(informe.ready).toBe(false);
    expect(informe.estadoRespaldo.ok).toBe(false);
    expect(informe.estadoRespaldo.motivo).toBe('Firestore timeout de lectura tras 45s');
    expect(informe.estadoRespaldo.consecutiveFailures).toBe(5);
  });

  it('con copia de hace 1 hora y 0 fallos, el informe sí da "Listo"', () => {
    const hace1Hora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const informe = evaluarInformeBackupFinal({
      status: {
        lastSuccessfulBackup: hace1Hora,
        consecutiveFailures: 0,
        lastError: null,
      },
    });

    expect(informe.ready).toBe(true);
    expect(informe.estadoRespaldo.ok).toBe(true);
    expect(informe.estadoRespaldo.motivo).toBeNull();
    expect(informe.estadoRespaldo.consecutiveFailures).toBe(0);
  });

  it('si consecutiveFailures es 0 pero la última copia tiene más de 24 horas, no da "Listo"', () => {
    const hace48Horas = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const informe = evaluarInformeBackupFinal({
      status: {
        lastSuccessfulBackup: hace48Horas,
        consecutiveFailures: 0,
        lastError: null,
      },
    });

    expect(informe.ready).toBe(false);
    expect(informe.estadoRespaldo.ok).toBe(false);
    expect(informe.estadoRespaldo.motivo).toContain('más de 24 horas');
  });
});
