# Orden 234 — La IA arma sola la web del evento (26/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada (`gemini/orden-234-web-con-ia`).
Si un bloque se traba, entregá el resto en la misma propuesta y avisá cuál faltó. Antes de decir
"terminé", pasá `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

Pedido del dueño: *"quiero que la IA me arme las web de los eventos"*. Hoy la web (invitación digital)
se arma a mano sección por sección. Ninguna IA genera su contenido: no hay flujo en `src/ai/flows`.

## Qué ya existe y NO se toca

- **Editor:** `src/app/(app)/fiestas/nueva/pagina-web/page.tsx`. El autoguardado (~84-88) llama a
  `saveFiesta({ ...fiesta, invitacionDigital: d, invitacionConfig: c })`. No cambies cómo guarda.
- **Pantalla pública:** `src/app/invitacion/[fiestaId]/page.tsx` y `invitacion-publica-client.tsx`.
  Ninguna de las dos se toca.
- **Las 8 plantillas** de `src/components/invitacion/templates/index.ts`, las `Seccion*.tsx` del editor y
  `TemplatePickerGallery.tsx`.
- **Los permisos:** `saveFiesta` (`src/app/actions/fiesta/fiesta.actions.ts:298`) y
  `requireFiestaWriteAccess`.

## Bloque 1 — el flujo de IA

Archivo nuevo: `src/ai/flows/armar-web-del-evento-flow.ts`. Copiá la forma de
`src/ai/flows/generate-timeline-flow.ts`: `generateWithGeminiFallback` con
`getGeminiModelForAgent('fiestas_general')` y esquema Zod para la salida.

- **Entrada:** lo que la fiesta ya sabe.
  - Primero va `invitacionConfig`, si tiene datos. Sus campos son:
    - `nombreHomenajeada` y `nombreHomenajeado2`;
    - `tipoEvento`;
    - `fechaEvento` y `horaEvento`;
    - `nombreSalon`, `direccionSalon` y `linkMaps`;
    - `cronograma`, `dressCode` y `hitos`.
  - Si `invitacionConfig` no tiene esos datos, se toman de la ficha de la fiesta (agasajado, tipo, fecha,
    salón, itinerario).
- **Salida:** un `InvitacionDigitalData` parcial (`src/types/fiesta.ts:611`), con estos campos:
  - `plantilla`: uno de los 8 valores de la línea 614, elegido según el tipo de evento.
  - `cabecera.protagonista1`/`protagonista2`, `cabecera.subtitulo` y `cabecera.paletaColores`.
  - `bienvenida.titulo` y `bienvenida.texto`.
  - `historia` y el itinerario, armado con el `cronograma` real.
  - `dressCode`.
  - El `visible` de cada sección: sólo van visibles las que tienen datos.
- **Reglas del texto, que van en el prompt:**
  - En español rioplatense, cálido y corto.
  - **No inventar datos**: ni fechas, ni horas, ni direcciones, ni nombres que no vengan en la entrada.
    Si falta un dato, la sección queda oculta.
  - Sin precios, sin "garantía", sin promesas y sin nombrar a nadie del personal.
  - **Datos bancarios de `regalos`: la IA NO los escribe nunca**, ni los toca.
- **Fotos:** sólo las que ya tiene la fiesta (`fotoPortada`, `galeriaFotos`). Si no hay, una de ejemplo
  del tema correcto (decisión del dueño). **Nunca** las de picsum de `src/lib/invitacion-digital-defaults.ts`.
- **Gasto:**
  - Antes de llamar a la IA, `hayPresupuestoParaIA` (`src/lib/ai/consumo-servidor.ts:90`). Si da no, se
    corta con el cartel "Se llegó al tope de IA del mes".
  - Después de llamarla, `registrarConsumoIA` (línea 43).
  - Sumá la función nueva a `FuncionConCosto` y `COSTO_ESTIMADO_UYU` (`src/lib/ai/consumo.ts:14` y `:35`).

## Bloque 2 — la acción del servidor

En un archivo nuevo, `src/app/actions/fiesta/armar-web-con-ia.actions.ts`, crear
`armarWebConIA(fiestaId: string)`:

1. **Primera línea:** `await requireFiestaWriteAccess(fiestaId)`. Es el mismo permiso que el editor.
2. Lee la fiesta y llama al flujo.
3. **Mezcla, no pisa.** Lo que el equipo ya escribió a mano (un campo no vacío y distinto del valor por
   defecto) queda. La IA sólo completa lo vacío, salvo que venga `{ rehacer: true }`.
4. **No guarda.** Devuelve `{ success, invitacionDigital }` o `{ success: false, error }`. El editor lo
   aplica y su autoguardado de siempre lo guarda. Así no hay un segundo camino de guardado.

## Bloque 3 — el botón en el editor

En `pagina-web/page.tsx` va el botón **"Armar con IA"**, arriba del editor, con estos estados:

- **Mientras trabaja:** "Armando tu web…".
- **Al terminar:** aplica el resultado y muestra "Listo: revisá y ajustá lo que quieras", con un botón
  **"Deshacer"** que vuelve a lo de antes.
- **Si falla:** el error en criollo. No dice "listo".
- **Automático:** si la fiesta no tiene `invitacionDigital` o la tiene vacía, al abrir el editor se arma
  sola una vez, con el mismo cartel. Si ya tiene contenido, sólo se arma con el botón.
- Un segundo botón, **"Rehacer todo"**, pide confirmación y llama con `rehacer: true`.

## Bloque 4 — pruebas (que miren el resultado)

- **Jest, `src/__tests__/la-ia-arma-la-web-sin-inventar.test.ts`.** Con la IA simulada, comprobar:
  - (a) Con fiesta "15 de Sofía, 12/12, Salón X", la salida tiene "Sofía" en `protagonista1` y la plantilla
    es de XV.
  - (b) Sin dirección en la entrada, la sección de ubicación queda `visible: false`.
  - (c) Un texto de bienvenida escrito a mano no cambia.
  - (d) Con `regalos.datosBancarios` cargados, siguen idénticos.
  - (e) Sin presupuesto de IA, devuelve `success: false` y no llama al modelo.
  - (f) Una sesión de personal sin acceso de escritura es rechazada.
  - Rompé a propósito la mezcla de (c) y fijate que la prueba se ponga en rojo.
- **Navegador, `tests/e2e/la-ia-arma-la-web-del-evento.spec.ts`.** Con la respuesta del servidor cortada
  y simulada, comprobar:
  - tocar "Armar con IA" muestra el nombre en la vista previa;
  - "Deshacer" lo saca.

Corré esas dos solas, después `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá
las últimas líneas de cada uno en la propuesta.

```comprobar
archivo: src/ai/flows/armar-web-del-evento-flow.ts
usa: hayPresupuestoParaIA en src/ai/flows/armar-web-del-evento-flow.ts
usa: requireFiestaWriteAccess en src/app/actions/fiesta/armar-web-con-ia.actions.ts
usa: armarWebConIA en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
usa: Deshacer en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
prueba: src/__tests__/la-ia-arma-la-web-sin-inventar.test.ts
prueba: tests/e2e/la-ia-arma-la-web-del-evento.spec.ts
```
