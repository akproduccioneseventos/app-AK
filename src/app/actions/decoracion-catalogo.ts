'use server';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { listDecorationDrafts, processDecorationDraft, approveCatalogDraft, dismissCatalogDraft, retryCatalogDraft } from '@/lib/decoracion/catalog-service';
import type { ElementoDecorativo } from '@/types/fiesta';

async function authorize() { await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION); }
export async function getDecorationDrafts() { await authorize(); return listDecorationDrafts(); }
export async function processNextDecorationDraft() { await authorize(); return processDecorationDraft(); }
export async function approveDecorationDraft(id: string, revision: number, nombre: string, elementos: ElementoDecorativo[]) {
  await authorize();
  try { await approveCatalogDraft(id, revision, nombre, elementos); return { success: true }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'No se pudo aprobar.' }; }
}
export async function dismissDecorationDraft(id: string) { await authorize(); await dismissCatalogDraft(id); }
export async function retryDecorationDraft(id: string) { await authorize(); await retryCatalogDraft(id); }
