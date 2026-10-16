# PARA GEMINI - Orden 180: el menú muestra sólo lo que cada perfil puede usar, y la galería filtra Vogue

**Va en la MISMA propuesta que las órdenes 178 y 179** (rama `claude/app-debug-stabilize-m70e6z`).
Salió de la auditoría de Gemini del 16/10/2026, verificada por Claude. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md`.

## Bloque 1 - El menú lateral no ofrece lo que el perfil no puede abrir

Hoy `navGroups` en `src/components/main-nav.tsx` (~81-155) muestra **todos** los botones a todos. Un
operador (permisos `NOCHE` y `ORGANIZACION`, `src/lib/auth/perfiles.ts` ~58) ve "Pagos Rápidos",
"Panel Contable", "Facturas", "Métricas del Negocio" y, al tocarlos, el servidor lo rechaza. **No se
cambia ningún permiso**: sólo se esconde el botón que igual no podría usar.

1. Acción nueva de sólo lectura `getMisPermisos()` en `src/app/actions/sesion.ts` (archivo nuevo,
   `'use server'`): con `verifySession()` devuelve `{ permisos: Permiso[] }` usando
   `PERMISOS_POR_PERFIL` / `puede` de `perfiles.ts`. Sin sesión, `{ permisos: [] }`. No devuelve nada más.
2. A cada item de `navGroups` agregale un campo opcional `permiso?: Permiso`. Los que lo llevan:
   - `CONTABILIDAD`: "Pagos Rápidos", "Panel Contable", "Facturas", "Cambios a Aprobar".
   - `GANANCIAS`: "Métricas del Negocio".
   - `CRM`: "Prospectos", "Presupuestos", "Clientes", "WhatsApp del Día", "Rendimiento Anuncios",
     "Marketing y Difusión", "Redes Sociales".
   - `INSUMOS`: "Comida / Menús", "Lista de Compras", "Proveedores".
   - `ADMINISTRACION`: "Empleados", "Ajustes Generales", "Tareas Automáticas", "Conexiones", "WhatsApp",
     "Cláusulas de Contrato", "Promociones", "Asistente IA", "Mapa Tecnológico", "Laboratorio Experimental".
   - Los demás quedan sin campo (los ve cualquiera con sesión). **"Seguridad" (`/settings/account`) queda
     sin campo**: cada uno cambia su propia clave.
   **Antes de fijar cada uno, abrí la acción del servidor que usa esa pantalla y usá el MISMO permiso que
   pide ahí.** Si alguno no coincide con esta lista, manda el del servidor y avisalo en la entrega.
3. `MainNav` llama `getMisPermisos()` al montar y filtra los items cuyo `permiso` no esté. Mientras carga,
   muestra sólo los items sin `permiso` (nunca todos). Un grupo que queda vacío no se dibuja.
4. Lo mismo para las tarjetas de `src/app/(app)/admin/page.tsx` (~92-118) y de la ficha de fiesta
   `src/app/(app)/fiestas/nueva/page.tsx` (~64-131): "Costos y Rentabilidad" con `GANANCIAS`, "Recibos
   del personal" con `SUELDOS`, y el resto según la acción de su pantalla.

## Bloque 2 - Galería del invitado: filtro Vogue y Tótem IA, y aviso moderno

`src/app/evento/galeria/[fiestaId]/page.tsx`:
- Pestañas (~412-417): sumá `{ id: 'bogue', label: '💎 Vogue' }` y `{ id: 'touchpix', label: '🤖 Tótem IA' }`,
  y en el filtro las mismas reglas que ya usa el álbum (`src/app/evento/album/[fiestaId]/page.tsx` ~249:
  `sourceModule === 'bogue' || 'boomerang'`; para Tótem IA, `sourceModule === 'touchpix'`). Si una
  fiesta no tiene fotos de esa estación, la pestaña no aparece.
- ~241: cambiá `alert('Enlace copiado al portapapeles')` por el `toast` de la app (`useToast`).
- **El pie comercial ya existe** (~819, "FOOTER COMERCIAL"): no lo dupliques.

## Pruebas

- `src/__tests__/el-menu-muestra-solo-lo-que-se-puede-usar.test.tsx`: con un operador, el menú no tiene
  "Pagos Rápidos", "Panel Contable", "Facturas" ni "Métricas del Negocio", y sí "Eventos Activos". Con el
  dueño los tiene todos. Y `getMisPermisos()` sin sesión devuelve `[]`.
- `src/__tests__/la-galeria-filtra-vogue.test.tsx`: con una foto `sourceModule: 'bogue'`, la pestaña Vogue
  aparece y la muestra; sin fotos de Vogue, la pestaña no aparece. Nombrá la ruta `/evento/galeria/[fiestaId]`.

```comprobar
archivo: src/app/actions/sesion.ts
usa: getMisPermisos en src/components/main-nav.tsx
usa: permiso: PERMISOS.CONTABILIDAD en src/components/main-nav.tsx
usa: 'bogue' en src/app/evento/galeria/[fiestaId]/page.tsx
no-usa: alert('Enlace copiado al portapapeles') en src/app/evento/galeria/[fiestaId]/page.tsx
prueba: PENDIENTE src/__tests__/el-menu-muestra-solo-lo-que-se-puede-usar.test.tsx
prueba: PENDIENTE src/__tests__/la-galeria-filtra-vogue.test.tsx
```
