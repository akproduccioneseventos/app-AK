import type { PublicGuestEvent } from "@/lib/guest-portal-public-data";

export interface PublicGuestMenuSection {
  key: string;
  label: string;
  value: string;
}

function section(
  key: string,
  label: string,
  value: string | undefined,
): PublicGuestMenuSection | null {
  const normalized = value?.trim();
  return normalized ? { key, label, value: normalized } : null;
}

function compactSections(
  sections: Array<PublicGuestMenuSection | null>,
): PublicGuestMenuSection[] {
  return sections.filter(
    (item): item is PublicGuestMenuSection => item !== null,
  );
}

export function getPublicGuestMenuSections(
  event: Pick<PublicGuestEvent, "menuMesa" | "menuSeleccionPortal">,
): PublicGuestMenuSection[] {
  const tableMenu = compactSections([
    section("entrada", "Entrada", event.menuMesa?.entrada),
    section("principal", "Plato principal", event.menuMesa?.platoPrincipal),
    section("adolescentes", "Menu adolescente", event.menuMesa?.adolescentes),
    section("postres", "Postres", event.menuMesa?.postres),
    section("bebidas", "Bebidas", event.menuMesa?.bebidas),
  ]);

  if (tableMenu.length > 0) return tableMenu;

  return compactSections([
    section("entrada", "Entrada", event.menuSeleccionPortal?.entrada),
    section("principal", "Plato principal", event.menuSeleccionPortal?.principal),
    section("postre", "Postre", event.menuSeleccionPortal?.postre),
    section("bebidas", "Bebidas", event.menuSeleccionPortal?.bebidas),
  ]);
}
