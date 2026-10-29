'use server';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  listDecorationDrafts,
  processDecorationDraft,
  approveCatalogDraft,
  dismissCatalogDraft,
  retryCatalogDraft,
  deleteCustomDecorationElement,
  getCustomDecorationElements,
} from '@/lib/decoracion/catalog-service';
import { AK_DECORATION_ELEMENTS } from '@/lib/decoracion/ak-library';
import type { ElementoDecorativo } from '@/types/fiesta';

export async function getDecorationDrafts() { await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION); return listDecorationDrafts(); }
export async function processNextDecorationDraft() { await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION); return processDecorationDraft(); }
export async function approveDecorationDraft(id: string, revision: number, nombre: string, elementos: ElementoDecorativo[]) {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  try { await approveCatalogDraft(id, revision, nombre, elementos); return { success: true }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'No se pudo aprobar.' }; }
}
export async function dismissDecorationDraft(id: string) { await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION); await dismissCatalogDraft(id); }
export async function retryDecorationDraft(id: string) { await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION); await retryCatalogDraft(id); }

export async function deleteDecoLibraryElement(id: string) {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  await deleteCustomDecorationElement(id);
  return { success: true };
}

export async function getDecoLibraryElements() {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  const custom = await getCustomDecorationElements();
  return [...AK_DECORATION_ELEMENTS, ...custom];
}
