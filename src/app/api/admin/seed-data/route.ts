import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { syncToFirestore } from '@/lib/firebase-sync';
import { writeData } from '@/lib/data-service';

type SeedResult = {
  file: string;
  status: 'success' | 'skipped' | 'error';
  count: number;
};

type SeedTarget = {
  fileName: string;
  writer: 'sync' | 'writeData';
};

const SEED_TARGETS: SeedTarget[] = [
  { fileName: 'servicios-empresa.json', writer: 'sync' },
  { fileName: 'activos-fijos.json', writer: 'sync' },
  { fileName: 'proveedores.json', writer: 'sync' },
  { fileName: 'empleados.json', writer: 'sync' },
  { fileName: 'insumos.json', writer: 'sync' },
  { fileName: 'crm-leads.json', writer: 'sync' },
  { fileName: 'crm-stages.json', writer: 'sync' },
  { fileName: 'roles.json', writer: 'sync' },
  { fileName: 'armado-rapido-config.json', writer: 'sync' },
  { fileName: 'bebidas-template.json', writer: 'sync' },
  { fileName: 'reposteria-template.json', writer: 'sync' },
  { fileName: 'carga-operativa-master-template.json', writer: 'sync' },
  { fileName: 'meeting-checklist-template.json', writer: 'sync' },
  { fileName: 'budget-display-settings.json', writer: 'sync' },
  { fileName: 'invoice-template-settings.json', writer: 'sync' },
  { fileName: 'playbooks.json', writer: 'writeData' },
  { fileName: 'menus-catering.json', writer: 'writeData' },
  { fileName: 'itinerary-templates.json', writer: 'writeData' },
  { fileName: 'salon-layout-templates.json', writer: 'writeData' },
  { fileName: 'fiestas-historicas.json', writer: 'writeData' },
];

function getCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  return value == null ? 0 : 1;
}

function isEmptyData(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return value == null;
}

function readRepoJson(fileName: string) {
  const filePath = path.join(process.cwd(), 'src', 'data', fileName);
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawContent);
}

export async function POST() {
  const results: SeedResult[] = [];
  const errors: string[] = [];

  try {
    for (const target of SEED_TARGETS) {
      try {
        const data = readRepoJson(target.fileName);
        const count = getCount(data);

        if (isEmptyData(data)) {
          results.push({ file: target.fileName, status: 'skipped', count });
          continue;
        }

        if (target.writer === 'writeData') {
          await writeData(target.fileName, data);
        } else {
          await syncToFirestore(target.fileName, data);
        }

        results.push({ file: target.fileName, status: 'success', count });
      } catch (error: any) {
        const message = `${target.fileName}: ${error?.message || 'error inesperado'}`;
        errors.push(message);
        results.push({ file: target.fileName, status: 'error', count: 0 });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'Datos restaurados desde el repositorio.'
          : 'Restauración completada con advertencias o errores.',
      results,
      errors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudieron restaurar los datos desde el repositorio.';

    return NextResponse.json(
      {
        success: false,
        message: 'No se pudieron restaurar los datos desde el repositorio.',
        results,
        errors: [...errors, message],
      },
      { status: 500 }
    );
  }
}
