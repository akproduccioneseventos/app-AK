# PARA GEMINI - Orden 182: ordenar la app para que sea más práctica (5 pestañas por fiesta, portal en 5 pasos, un centro de Marketing)

**Aprobado por el dueño el 16/10/2026** ("Ordenar todo"). **Entrega SEPARADA, después de la que junta
178 a 181**: es grande y mezclarla haría imposible saber qué rompió qué. Una sola propuesta para los
cuatro bloques de acá.

## La regla de esta orden: ORDENAR, no rehacer

- **No se borra ninguna pantalla ni se cambia ninguna dirección.** Hay QR impresos, enlaces mandados a
  clientes y pruebas que las abren. Lo que cambia es **cómo se llega**: se agrupan las puertas.
- **No se fusionan pantallas** (por ejemplo "Evento en Vivo", "Centro de Fiesta" y "Hub" siguen siendo
  tres pantallas): se ponen juntas, una al lado de la otra, en la misma pestaña.
- **Los permisos no cambian.** Si la orden 180 ya está, cada tarjeta respeta el filtro por perfil.

## Bloque 1 - La ficha de la fiesta: de 48 tarjetas en 12 grupos a 5 pestañas por momento

`src/app/(app)/fiestas/nueva/page.tsx`: las tarjetas están en la lista de ~64-135 con un campo
`category`, y se agrupan con `categoryMeta` (~146). Agregá a cada tarjeta un campo `pestana` y dibujá
**5 pestañas** (`Tabs` de `@/components/ui/tabs`), con la pestaña elegida guardada en la dirección
(`?pestana=...`) para que "volver" deje donde estaba. Dentro de cada pestaña se mantienen los subtítulos
de `category`. El reparto, por `id`:

1. **`contrato-y-pagos` — "Contrato y pagos"**: `configuracion`, `resumenPlanificacion`, `tareas`,
   `reuniones`, `documentos`, `planPagos`, `costos`.
2. **`cliente-e-invitados` — "Cliente e invitados"**: `portalCliente`, `invitados`, `paginaWeb`,
   `moduloInvitado`, `disenoSalon`, `musica`, `videoVida`, `itinerario`, `decoracion`, `regalos`.
3. **`comida-y-barra` — "Comida, barra e impresos"**: `catering`, `alergias`, `listaCompras`,
   `plannerCostoFiesta`, `cartaTragos`, `barraTecnologica`, `carteleria`, `menuMesa`, `numerosMesa`.
4. **`equipo-y-logistica` — "Equipo y logística"**: `personal`, `accesosPersonal`, `cargaOperativa`,
   `logistica`, `proveedoresPortal`, `resumenImprimible`.
5. **`noche` — "La noche"**: `checkin`, `enVivo`, `centroFiesta`, `muroSocial`, `redSocial`,
   `zonaDigital`, `pantallasTotem`, `playlistPantalla`, `entretenimiento`, `fotografia`, `buzon`,
   `readiness`, `fiestaLista`, `feedback`, `postEvento`.
Si encontrás una tarjeta que no está en esta lista, ponela donde corresponda por su `category` y avisalo.
**Ninguna tarjeta puede quedar fuera de las 5 pestañas** (la prueba lo cuenta).

## Bloque 2 - El portal del cliente: de 22 botones a 5 pasos, sin repetidos

`src/app/portal/page.tsx`, `portalModules` (~136-159). Agregá el campo `paso` y dibujá cinco bloques
con título, en este orden:
1. **"Mi fiesta"**: `itinerario` (Cronograma), `ubicacion`, `dressCode`, `notasCliente`, `checklist`, `faq`.
2. **"Mis invitados"**: `invitados`, `simuladorInvitados`, `paginaPublica`, `listaRegalos`.
3. **"Música, fotos y video"**: `musica`, `videoVida`, `moodboard`.
4. **"Menú y barra"**: `menu`, `cartaTragos`, `calculadoraBebidas`.
5. **"Contrato y pagos"**: `contrato`, `pagos`, `informarPago`, `serviciosContratados`.
**Repetidos, verificado por Claude:** `documentos` y `contrato` abren `/portal/${id}/contrato`;
`videoVida` y `fotografiaYFilmacion` abren `/portal-cliente/${id}/fotos-video`. Sacá `documentos` y
`fotografiaYFilmacion` de la grilla (las direcciones viejas `/portal/[id]/documentos` y
`/portal/[id]/fotografia` siguen redirigiendo, eso está en `src/app/portal/[fiestaId]/[module]/page.tsx`).
Los extras para sumar (orden 181) quedan abajo de los cinco pasos.

## Bloque 3 - Un solo lugar para Marketing

Hoy hay seis entradas: `/marketing`, `/empresa/marketing`, `/empresa/redes-sociales`,
`/empresa/redes-sociales/ia-marketing`, `/empresa/presencia-digital` y `/contabilidad/crm/marketing-ads`.
- `/marketing` (`src/app/marketing/`) pasa a ser **la puerta única**: arriba, cuatro tarjetas grandes que
  llevan a las pantallas que ya existen: **"Calendario y publicaciones con IA"** (`/empresa/redes-sociales`
  y `/empresa/redes-sociales/ia-marketing`), **"Campañas y anuncios"** (`/contabilidad/crm/marketing-ads`),
  **"Reseñas y Google"** (`/empresa/presencia-digital`), **"Web pública y portada"** (`/empresa/marketing`).
  Lo que `/marketing` muestra hoy queda debajo.
- En el menú lateral (`src/components/main-nav.tsx` ~132-136) quedan **"Marketing y Redes"** →
  `/marketing` y **"WhatsApp del Día"**; salen "Marketing y Difusión", "Redes Sociales" y "Rendimiento
  Anuncios" (siguen accesibles desde `/marketing`).
- En `src/app/(app)/admin/page.tsx` (~94-117): **"Nuevo Lead / Contacto" y "CRM / Seguimiento"** van al
  mismo lugar: dejá una sola, **"Prospectos"**. **"Redes Sociales y Marketing" y "Marketing 360"** también:
  dejá una, **"Marketing y Redes"**.

## Bloque 4 - El mapa y el manual al día

Esto cambia el menú: corré `npm run mapa:generar` y actualizá `docs/MANUAL-DE-LA-APP.md` (la parte en
criollo: dónde quedó cada cosa). La prueba `src/__tests__/mapa-de-la-app-al-dia.test.ts` tiene que pasar.

## Pruebas (qué tienen que comprobar)

- `src/__tests__/la-fiesta-en-cinco-pestanas.test.ts`: las 48 tarjetas de la ficha tienen `pestana`, cada una
  de las cinco tiene al menos una, y **la cantidad total de tarjetas es la misma que antes** (no se perdió
  ninguna). Nombrá la ruta `/fiestas/nueva`.
- `src/__tests__/el-portal-en-cinco-pasos.test.ts`: ningún `href` del portal se repite, cada módulo tiene
  `paso`, y `/portal/[id]/documentos` sigue redirigiendo al contrato.
- `tests/e2e/la-app-ordenada.spec.ts`: en escritorio y en celular, la ficha de una fiesta muestra las cinco
  pestañas, tocar "La noche" muestra "QR / Check-in" y la dirección guarda la pestaña; `/marketing` muestra
  las cuatro puertas y cada una abre su pantalla.
- Regenerá `tests/e2e/layout-baseline.spec.ts` si alguna de sus pantallas cambió, y decilo.

```comprobar
usa: pestana en src/app/(app)/fiestas/nueva/page.tsx
usa: paso en src/app/portal/page.tsx
usa: Campañas y anuncios en src/app/marketing/page.tsx
usa: Marketing y Redes en src/components/main-nav.tsx
no-usa: Nuevo Lead / Contacto en src/app/(app)/admin/page.tsx
no-usa: Marketing 360 en src/app/(app)/admin/page.tsx
# Bloque 4
archivo: docs/MANUAL-DE-LA-APP.md
prueba: src/__tests__/la-fiesta-en-cinco-pestanas.test.ts
prueba: src/__tests__/el-portal-en-cinco-pasos.test.ts
prueba: tests/e2e/la-app-ordenada.spec.ts
```
