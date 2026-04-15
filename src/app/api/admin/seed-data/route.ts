import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { syncToFirestore } from '@/lib/firebase-sync';

type SeedTarget = {
  fileName: 'servicios-empresa.json' | 'armado-rapido-config.json';
  collection: 'servicios' | 'configuracion';
  documentId?: string;
};

const SEED_TARGETS: SeedTarget[] = [
  { fileName: 'servicios-empresa.json', collection: 'servicios' },
  { fileName: 'armado-rapido-config.json', collection: 'configuracion', documentId: 'armado-rapido-config' },
];

function getCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length || 1;
  return value == null ? 0 : 1;
}

async function readRepoJson(fileName: SeedTarget['fileName']) {
  const filePath = path.join(process.cwd(), 'src', 'data', fileName);
  const rawContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(rawContent);
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.ADMIN_SEED_SECRET;
    if (configuredSecret) {
      const providedSecret = request.headers.get('x-admin-seed-secret');
      if (providedSecret !== configuredSecret) {
        return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
      }
    }

    const results: Array<{ file: string; collection: string; documentId?: string; count: number }> = [];

    for (const target of SEED_TARGETS) {
      const data = await readRepoJson(target.fileName);
      await syncToFirestore(target.fileName, data);
      results.push({
        file: target.fileName,
        collection: target.collection,
        documentId: target.documentId,
        count: getCount(data),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Datos restaurados desde el repositorio.',
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'No se pudieron restaurar los datos desde el repositorio.',
      },
      { status: 500 }
    );
  }
}
