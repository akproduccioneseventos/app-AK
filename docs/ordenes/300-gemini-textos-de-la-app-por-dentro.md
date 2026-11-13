# Orden 300 — Los textos de la app por dentro y de las pantallas del invitado (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 299**. Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 107.

Sale de una revisión de escritura de toda la app (32 hallazgos, 13/11/2026). Acá va **lo roto**. Las promesas de venta,
los logos de empresas como respaldo y los textos "100% / Listo / Excelente" quedan para el dueño: **no se tocan**.

## Ya pedido en otras órdenes (no lo repitas)

- "AK está preparando esta sección" en la invitación: orden 290, bloque 2 (ya entregado). Que también se aplique a
  `/evento/logistica/[fiesta]` ("AK todavia no cargo instrucciones…": ocultá la sección si no hay contenido).
- "wfolio y Google Drive" en post-fiesta: orden 290, bloque 3. "Oficina & Atención" del pie: orden 297, bloque 3.

## Barrido en toda la app (Claude, 13/11/2026)

- **Nombres de fiestas con caracteres rotos guardados** ("XV aÃ±os", "DÃaz", "En PlanificaciÃ³n"): salen de los datos,
  no del código. Se ven en panel, alertas, calendario, kioscos y borradores de Instagram.
- **Nombres "Otro de <cliente>"**: el tipo de evento "Otro" se usa para armar el nombre de la fiesta.
- **Post-fiesta para el cliente con lenguaje interno:** `src/app/post-fiesta/[fiestaId]/page.tsx` ("consumo de datos de
  Firebase", "sobrecargas de datos en la plataforma") y los pasos internos que vienen de
  `src/lib/experience-ak/ultimate-event-system.ts` ("texto sugerido por el agente", "Guardar aprendizaje").
- **Nota interna en la pantalla LED:** "sin aspecto de catalogo interno" en `src/app/presentacion-led/slides/portada-slide.tsx`.
- **Valores de ejemplo:** "RUT Ejemplo" en `src/types/settings.ts` y `src/app/(app)/invoices/new/page.tsx`; el contrato se
  ve con `{{FECHA_FIRMA_TEXTO}}`, `{{HITO_30}}` sin completar en Fiesta → Gestión documental.
- **Lenguaje de desarrollo en pantallas del equipo:** "PR #445" (`src/app/(app)/contabilidad/comercial-360/page.tsx`),
  "Stonk" (`src/app/(app)/empresa/menus/tragos/page.tsx`), `aiHint` visible.
- **Errores:** "Mas de 4 horas" (`src/app/simulador-de-presupuesto/page.tsx`), "alerta ya leída escondidas"
  (`src/app/(app)/alertas/page.tsx`), "Sábado, 28 De Noviembre" (mayúscula), signos "?" en lugar de tildes en el directorio
  de módulos de `/admin`, fechas tipo `2026-11-28T12:00:00.000Z` en la orden de evento y el selector de kiosco.
- **"Oficina AK Producciones" como lugar de entrevistas:** `src/components/simulator/SimulatorMeetingScheduler.tsx`,
  `src/app/actions/simulator-agenda.ts`, `src/app/actions/google-workspace.ts` (el dueño no tiene oficina).
- **Pantalla del invitado con pregunta de XV en un evento que no es XV:** `/evento/social/[fiesta]`.
- **Celular:** en `/simulador-ak`, el botón de enviar queda cortado a la derecha de la caja de texto (390 px).

## Bloque 1 — Reparar los nombres rotos guardados (P1)

Una tarea de una sola vez (idempotente) en `src/lib/automatico/` que recorre `fiestas.json`, clientes y prospectos y
arregla los textos con caracteres rotos (`Ã¡`→`á`, `Ã©`→`é`, `Ã±`→`ñ`, `Ã³`→`ó`, `Ã­`/`Ã`→`í`, `Ãº`→`ú`), **sólo en
campos de texto de nombre** (nombre, clienteNombre, título). Corre con sesión que no es auditor, deja un aviso con cuántos
arregló, y **no borra ni junta registros**. Los pares con el mismo cliente y fecha (p. ej. "XV aÃ±os de Claudia Flores" y
"XV años de Claudia Flores") **no se tocan**: se listan en el aviso para que el dueño decida.

## Bloque 2 — "Otro de …" pasa a "Evento de …" (P2)

Donde se arma el nombre de la fiesta con el tipo de evento, si el tipo es "Otro" usá **"Evento"**. Y en la tarea del bloque
1, renombrá los guardados "Otro de X" → "Evento de X".

## Bloque 3 — Post-fiesta y pantalla LED sin lenguaje interno (P1, lo ve el cliente)

- Post-fiesta: sacá "Firebase" y "sobrecargas de datos"; texto: **"Acá vas a encontrar las fotos, los videos y los
  mensajes de tu fiesta. Si no ves algo, escribinos por WhatsApp."** Los pasos internos (testimonio, piezas para redes,
  aprendizaje) **no se muestran al cliente**: van sólo en la vista del equipo.
- LED: sacá "sin aspecto de catalogo interno".

## Bloque 4 — Sin valores de ejemplo ni marcadores a la vista (P2)

- Si el RUT de la empresa es "RUT Ejemplo" o está vacío, el recibo y la factura no lo imprimen y la pantalla de Ajustes →
  Empresa muestra "Falta cargar el RUT".
- El contrato no muestra `{{…}}` sin completar: si un dato falta, la vista previa marca **"Falta: <dato>"** en rojo y no
  deja generar el PDF hasta completarlo.

## Bloque 5 — Errores y lenguaje de desarrollo (P3)

Todo lo del barrido: "PR #445" y "Stonk" fuera; `aiHint` no se muestra; "Más de 4 horas"; "alertas ya leídas
escondidas"; meses en minúscula; tildes en `/admin`; fechas con `formatearFechaEvento` (`src/lib/fechas/`); "Oficina AK
Producciones" → **"Lugar a coordinar"** (o videollamada, según lo que ya ofrezca la agenda); la pregunta de XV en
`/evento/social` sólo si la fiesta es de XV; el botón de enviar de `/simulador-ak` entero a 390 px.

## Pruebas

- `src/__tests__/los-nombres-rotos-se-reparan.test.ts`: "XV aÃ±os de Ana" → "XV años de Ana", "Otro de Juan" → "Evento de
  Juan"; una segunda corrida no cambia nada; un par repetido se lista y no se borra; con sesión de auditor no escribe.
- `src/__tests__/el-cliente-no-ve-lenguaje-interno.test.ts`: post-fiesta y LED no contienen "Firebase", "agente",
  "catalogo interno".
- `src/__tests__/el-contrato-no-muestra-marcadores.test.ts`: con un dato faltante, la vista previa dice "Falta:" y no hay `{{`.

```comprobar
no-usa: Firebase en src/app/post-fiesta/[fiestaId]/page.tsx
no-usa: sin aspecto de catalogo interno en src/app/presentacion-led/slides/portada-slide.tsx
no-usa: PR #445 en src/app/(app)/contabilidad/comercial-360/page.tsx
no-usa: Mas de 4 horas en src/app/simulador-de-presupuesto/page.tsx
no-usa: Oficina AK Producciones en src/components/simulator/SimulatorMeetingScheduler.tsx
prueba: src/__tests__/los-nombres-rotos-se-reparan.test.ts
prueba: src/__tests__/el-cliente-no-ve-lenguaje-interno.test.ts
prueba: src/__tests__/el-contrato-no-muestra-marcadores.test.ts
```
