# Seguimiento funcional candidato 125

**SUPERADO por fix125:** PWA probada antes (4fallos reales), corregida y7focales
PASS; incluida en759suites4765tests/build b520f7ce y pagina nativa PC/Pixel7.
No reencomendar este candidato. La instalacion real del OS sigue NO certificada.
Lo siguiente conserva el plan previo, no es pendiente actual de programacion.

- HEAD examinado: `d200fd6afbe68aea575fa5f0dc5ab37fce9334c0` (rama indicada `codex/125-kiosco-auditoria-main-20261014`). Evidencia estática solamente; no se ejecutó ni se reprodujo defecto.
- **NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE**: su HEAD no está disponible en este trabajo.
- Criterio: entradas `independent` de `125-alias-candidatos.json`; excluidas las once estaciones compartidas ya contrastadas y `/api/imports/confirmed-events-29` (datos reales). Ruta inventariada, referencia textual o entrada HTTP no se cuentan como recorrido funcional.

## Candidato no cerrado

1. **Instalación PWA de la aplicación completa desde Ajustes.** `/settings/instalar-app` consume `PwaInstallButton` (`src/app/(app)/settings/instalar-app/page.tsx`; `src/components/pwa-install-button.tsx`, `PwaInstallButton/handleInstall`). La acción usa eventos `beforeinstallprompt` y `appinstalled`, y espera `prompt()` y `userChoice`. No encontré en `YA-RESUELTO.md` ni en la cobertura 124 cierre de este flujo; `tests/e2e/instalar-solo-la-estacion.spec.ts` y `src/__tests__/api-route-boundary.test.ts` verifican el manifiesto aislado de estación/perímetro HTTP, no este botón global.

   **Escenario propuesto, ficticio y pendiente:** en navegador de prueba, emitir `beforeinstallprompt` para habilitar el botón, pulsarlo y controlar un `userChoice` aceptado; comprobar que no queda como si la instalación siguiera disponible y que `appinstalled` presenta estado instalado. Repetir con rechazo y con respuesta demorada/perdida (sin resolver `userChoice`); comprobar que el estado visible no afirma instalación y que un evento concurrente `appinstalled` no lo revierte. Sin cuenta real, compra ni datos productivos.

No se proponen más recorridos: los candidatos de compras/proveedores, aprobaciones y tareas tienen cierres y pruebas específicas en `YA-RESUELTO.md`; el endpoint del manifiesto ya tiene E2E, pero es distinto del flujo anterior. No se concluye que exista un fallo: solo falta evidencia de aceptación del recorrido aquí descrito.

**Límites:** lectura dirigida de `AGENTS.md`, `YA-RESUELTO.md`, cobertura 124, inventario de alias 125, símbolos/consumidores y nombres de pruebas. Graphify se consultó de forma puntual; se usó `rg`. Sin editar app/package/estado, ejecutar pruebas, compilar, Git, servidor, navegador, credenciales o SDK. El plan no fue ejecutado y requiere contraste con la tanda privada antes de convertirse en orden.
