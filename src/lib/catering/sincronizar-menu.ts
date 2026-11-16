import type { FullMenu } from '@/types/catering';

export function sincronizarDescripcionMenu(menu: FullMenu): FullMenu {
  const count = (menu.items || []).length;
  let description = menu.description || '';
  if (menu.id === 'menu_entradas_maestro' || /entradas/i.test(menu.name)) {
    description = `Selección completa de las ${count} entradas disponibles.`;
  } else if (menu.id === 'menu_principales_maestro' || /principales/i.test(menu.name)) {
    description = `Selección completa de las ${count} opciones principales.`;
  } else if (description) {
    description = description
      .replace(/\b\d+\s+entradas\s+disponibles\b/i, `${count} entradas disponibles`)
      .replace(/\b\d+\s+opciones\s+principales\b/i, `${count} opciones principales`);
  }
  return {
    ...menu,
    description,
  };
}
