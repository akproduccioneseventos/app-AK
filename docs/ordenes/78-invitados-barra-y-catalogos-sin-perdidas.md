# Orden 78: invitados, barra y catalogos sin perdidas

## Responsables y base

Codex audita; Claude implementa permisos, datos y stock, y compila el conjunto. Gemini solo interfaz vinculada y mensajes. No fusionar: decide el dueno. Incorporar a una tanda coordinada, no una PR por hallazgo. No ejecutar nuevas funciones comerciales ni cambiar recorrido sin aprobacion.

Base main54cd6230d8fd10d91b031c5ae5320125e8d1bd41. PR1207/1206/1202/1197 contrastadas con sus HEAD indicados en docs/auditoria/BARRA-INVITADOS-CATALOGOS-2026-09-22.md: no aportan cambios a los archivos afectados. Actualizar contraste antes de programar. PR1209/1210 ya fusionadas, no escribir en ellas.

## Primero: limites publicos del invitado

- INV01: submitPublicRsvp propaga updatedFiesta del helper interno. Devolver solo campos publicos necesarios del invitado autorizado, nunca fiesta completa ni otros invitados. Revisar que otras lecturas exportadas no permitan el mismo acceso.
- INV02: un nombre coincidente obtiene credencial de invitado existente. Mantener cambio de asistencia y deduplicacion aprobados; NO usar nombre como autenticacion. Presentar al dueno la minima verificacion necesaria antes de cambiar el recorrido. No quitar RSVP ni invalidar todos los enlaces por defecto.
- Pruebas: datos ficticios de dos invitados; anonimo no recibe campos internos ni credencial ajena; invitado legitimo cambia asistencia sin duplicar; alta nueva funciona; fallo de persistencia no declara confirmacion.

## Segundo: pedido de barra y stock inseparables

- BAR01: comprobar resultado de saveFallbackOrders/saveFiesta. Guardado fallido no puede anunciar pedido registrado ni dejar descuento huerfano. Reintento idempotente, sin doble consumo.
- BAR02: recuperar cadena de stock tras error transitorio en fallback, sin ocultar error original ni perder serializacion.
- BAR03: cambiar trago no cancela irreversiblemente el anterior cuando el reemplazo falla. Proteger tambien la carrera con el barman; no cambiar reglas de cancelacion.
- Probar alta, fallo de cada escritura, reemplazo rechazado, reintento, dos solicitudes y recarga. Validar resultado visible en MiniQuiosco y pantalla de barra.

## Tercero: conservar fotos y salones

- CAT01/CAT02: mutaciones por registro o transaccion calculada sobre estado actual. No reescribir listas completas obsoletas. Probar dos fotos nuevas y dos salones distintos actualizados a la vez: ambos guardados deben permanecer.
- CAT03: borrado individual del ultimo registro. No desactivar proteccion global de array vacio. Recargar confirma ausencia, no basta desaparecer la tarjeta.
- Preservar cambios de otras IA y datos reales. No ejecutar sondas con fiestas, catalogos o stock de produccion.

## Evidencia exigida

Informe vinculado y sonda existentes: docs/evidencias/barra-invitados-catalogos-sonda.cjs (20 casos,9 PASS/11 FAIL en base). No equivale a E2E. Los tests de regresion de abajo son PROPUESTOS y PENDIENTES: no afirmar que existen o pasaron hasta implementarlos y ejecutarlos. Actualizar el registro compartido por hallazgo con SHA, prueba, resultado y limites. Claude compila una sola vez sobre conjunto congelado; registrar omisiones y entorno. No declarar toda la app lista por estos arreglos.

```comprobar
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: submitPublicRsvp en src/app/invitacion/[fiestaId]/rsvp/page.tsx
prueba: src/__tests__/rsvp-respuesta-minima-y-credencial.test.ts
archivo: src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: createBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
prueba: src/__tests__/barra-pedido-y-stock-consistentes.test.ts
archivo: src/app/actions/catalogo-fotos.ts
usa: addCatalogoFoto en src/app/(app)/empresa/galeria/page.tsx
prueba: src/__tests__/catalogos-concurrencia-y-ultimo-borrado.test.ts
archivo: src/app/actions/salones.ts
usa: saveSalon en src/app/(app)/empresa/salones/page.tsx
prueba: src/__tests__/catalogos-concurrencia-y-ultimo-borrado.test.ts
```

