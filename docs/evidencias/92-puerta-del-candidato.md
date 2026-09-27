# Evidencia de la puerta sobre el candidato — 27 de septiembre de 2026

Respuesta de Claude a la orden 92, punto 1 y punto 3. Todo corrido en el contenedor de Claude Code
(Linux, Chromium local de Playwright, datos locales de prueba), **sobre el commit `2ffe6f90726e4513202bbd9d9f0edd780b46f5bd`**:
`main` `63dace0` más la orden 91. No se tocó ninguna fiesta, cobro ni cliente real.

## Controles

| Control | Comando | Resultado |
|---|---|---|
| Revisor de tipos | `npx tsc --noEmit` | 0 errores (corrido de nuevo sobre `2ffe6f907`) |
| Pruebas de Jest | `npx jest --silent` | 512 archivos, **3014 pasan, 0 fallan** (corrido de nuevo) |
| Acentos | `npm run check:acentos` | bien, 2234 archivos |
| Compilación | dentro de `npm run "publicar?"` | bien (479 s) |
| Reglas de la base | dentro de `npm run "publicar?"` | bien |
| Puerta completa | `npm run "publicar?"` | **verde** (código 0). Tipos y Jest los tomó de su registro por huella de contenido; por eso se volvieron a correr sueltos arriba |
| Navegador, **todas** | `AK_PRUEBAS_TODAS=true npm run test:e2e` | 88 archivos, 900 casos: **342 pasan, 0 fallas, 558 salteados a propósito** |

**Qué son los 558 salteados:** la herramienta que saca las fotos de la app (sólo corre con
`AK_FOTOS=true`) y las pruebas marcadas sólo-escritorio, que no corren en el perfil de celular.
No son fallas tapadas: el corredor distingue "fallas reales" y dio cero.

Incluidas en esa corrida, entre otras: `simulator-budget-journey`, `internal-smoke`,
`49-contabilidad-cobros-conciliados`, `viaje-invitado`, `89-ia-no-frena-la-fila` y
`90-lo-que-va-atras-dice-donde-quedo`.

**Fallas por carga vistas en la tanda** (pasaron solas con `npm run otravez`, sin tocar código):
la cápsula del tiempo del buzón, en las corridas de las propuestas 1230 y 1231.

## Orden 91

- `src/__tests__/la-captura-sobrevive-al-servidor-y-a-la-ia-lenta.test.ts`: 9 casos. Incluye la
  captura real extraída de la pantalla con el aviso al servidor colgado, la IA diez minutos con la
  pantalla viva, la pantalla cerrada, y la cola compitiendo con el final y con otra pestaña.
- **Se probó rompiéndolo**, de tres maneras, y las tres veces se puso en rojo: volviendo a esperar el
  aviso antes de guardar, sacando el reclamo de la cola y sacando la retención al terminar.
- La sonda `1231-contraste.cjs` de Codex **no corre sobre el diseño nuevo**. Supone la retención fija
  y no conoce el reclamo; sus mismos escenarios quedaron en la prueba de arriba.

## Lo que esta evidencia NO cubre (sigue abierto en la matriz)

- **Qué versión atiende el dominio.** Desde este contenedor no se puede entrar a
  `akproducciones.uy`: la red lo rechaza. El despliegue y su prueba de humo se miran desde la
  consola de Firebase o desde un entorno con salida.
- **Recorridos con cuentas por rol en un entorno aislado.** Las pruebas de arriba usan sesiones de
  prueba firmadas y datos locales. No hay un proyecto de Firebase de pruebas separado, y crearlo
  lo decide el dueño.
- **Integraciones reales** (Instagram, WhatsApp, Gmail, Mercado Pago). Sólo se prueba que la app
  arme bien el pedido, no el intercambio real.
- **Ensayo físico** con cámaras, impresoras, 360 y barra: `docs/ENSAYO-EN-EL-SALON.md`.
