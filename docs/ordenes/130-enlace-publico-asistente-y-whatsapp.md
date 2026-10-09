# 130. Compartir un presupuesto que el cliente pueda abrir

9/10/2026. Codex revisa; Gemini programa pantallas, Claude conserva permisos y compila.
No modificar datos reales, reglas comerciales ni fusionar sin el propietario.

## Versiones y clasificacion

- Recorrido real de auditoria 80: main `09c8d814fdecdca00da71de7bc22c1d64ef0e662`,
  BUILD_ID `y3pk-oG28Gx7I91pIPgS2`, entorno aislado, 8/10/2026.
- Codigo contrastado: main `497ee725cb4d8cce6d1c97422fd674cbbe86c051`.
- Segundo contraste tras fusion de Claude: main `1b57abbec5162402cc30269cc276398707b28d55`.
  Los tres archivos causales NO cambiaron, siguen pendientes; no habia PR abierta.
- GitHub no tenia PR abiertas al iniciar este contraste. Reconsultar antes de programar.
- Los tres caminos causales siguen presentes. Recorrido del SHA nuevo pendiente:
  no confundir el contraste de codigo con una segunda prueba de navegador.
- Evidencias: `docs/evidencias/80-resultados/04-enlace-copiado.txt`,
  `18-factura-boton-cubierto.json` y `24-cliente-enlace-whatsapp.txt`.
  Inventario exacto: `docs/evidencias/80-recorridos-y-pendientes.md`.

## SHARE80 - P1 - La barra copia el enlace privado

Area: plata / permisos. Pantalla: `/presupuestos/<id>/ver`, sesion del equipo.
Pulsar copiar en la barra flotante produce la URL interna sin `cliente=1` ni token.
El destinatario sin sesion acaba en login. Compartir por WhatsApp y compartir nativo
usan la misma funcion. El boton propio de la pagina SI emite el enlace publico seguro.

Origen: `getCurrentBudgetUrl` en `src/components/presupuestos/budget-share-dock.tsx`.
Consumidor: `BudgetShareDock` en `src/app/(app)/layout.tsx`.
Emisor que ya existe: `handleSharePublicBudget` y `getPresupuestoShareToken` en
`src/app/(app)/presupuestos/[id]/ver/page.tsx`.

Unificar copiar, WhatsApp y compartir nativo con el emisor seguro existente.
No abrir la lectura privada, quitar tokens ni habilitar cobros del cliente.
Aceptacion: los tres enlaces abren el mismo presupuesto anonimamente; token invalido
no da acceso, un fallo al emitir token no se anuncia como enlace copiado.
Prueba E2E nueva propuesta, PENDIENTE: `tests/e2e/130-compartir-presupuesto-publico.spec.ts`.

## HIT80 - P2 - El asistente intercepta Nueva Factura

Area: plata / asistente. En `/invoices`, 1280x720, el centro de Nueva Factura
cae sobre el boton del asistente: el clic abre el chat. Con teclado la factura abre.
No es fallo de permisos ni de facturacion de GitHub.

Origen: `ContextualAssistantIndicator`, posicion `fixed right-5 top-20 z-30`,
`src/components/assistant/contextual-assistant-indicator.tsx`.
Consumidor: `src/app/(app)/layout.tsx`; accion tapada: `src/app/(app)/invoices/page.tsx`.
Reubicar sin tapar controles; conservar el asistente contextual.
Aceptacion: clic real al centro abre la factura en desktop y movil; chat sigue accesible.
Prueba nueva propuesta, PENDIENTE: `tests/e2e/130-factura-sin-superposicion.spec.ts`.

## WA80 - P2 - El enlace de un telefono local no tiene pais

Area: fiesta / CRM. Un cliente ficticio con `099000080` genera `wa.me/099000080`.
Origen: `CustomerTable` (singular), `src/app/(app)/customers/page.tsx`.
Normalizar SOLO el enlace con el helper internacional existente, no el telefono guardado.
Buscar consumidores equivalentes; el resumen del cliente tambien tiene este patron.
Conservar clientes con solo telefono, varios presupuestos por prospecto y numeros extranjeros.
Aceptacion: local uruguayo genera enlace internacional correcto; internacional no duplica
prefijo; no se envian mensajes durante la prueba. Prueba propuesta, PENDIENTE:
`src/__tests__/130-clientes-enlace-whatsapp.test.ts`.

## No repetir

CLIENTEPAGO80 y CITA80 ya tienen correccion en main: el cliente no ve Informar Pago y
la cita busca el prospecto autorizado por presupuesto en el servidor. No rehacerlos.
No usar el resultado incompleto del archivo 23 como prueba de persistencia del ultimo cobro.

```comprobar
archivo: src/components/presupuestos/budget-share-dock.tsx
usa: BudgetShareDock en src/app/(app)/layout.tsx
prueba: PENDIENTE tests/e2e/130-compartir-presupuesto-publico.spec.ts
archivo: src/components/assistant/contextual-assistant-indicator.tsx
usa: ContextualAssistantIndicator en src/app/(app)/layout.tsx
prueba: PENDIENTE tests/e2e/130-factura-sin-superposicion.spec.ts
archivo: src/app/(app)/customers/page.tsx
usa: CustomerTable en src/app/(app)/customers/page.tsx
prueba: PENDIENTE src/__tests__/130-clientes-enlace-whatsapp.test.ts
```
