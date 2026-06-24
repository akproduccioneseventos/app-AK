# Auditoria de publicacion - 2026-06-23

## Alcance

Auditoria tecnica completa orientada a destrabar publicacion, estabilidad de Firebase App Hosting, calculos contables/planes de pago, pantallas publicas y rutas migradas a Next 15.

## Correcciones principales

- Se migro la app a `next@15.5.19` y `eslint-config-next@15.5.19` para quitar advisories criticos/directos de la version anterior.
- Se actualizo `jspdf` a `4.2.1` y se agrego `canvg` para evitar el error de build por dependencia opcional faltante.
- Se adapto el uso de `params`, `searchParams`, `cookies()` y `headers()` al API asincronico de Next 15.
- Se reemplazo el import interno `next/dist/server/after/get-builtin-request-context` por el API publico `after` de `next/server`.
- Se separo `SESSION_COOKIE_NAME` a un archivo compatible con Edge para que el middleware no arrastre `crypto` de Node.
- Se elimino el fallback estable/hardcodeado de firma de sesiones y portal; en produccion ahora se exige `AK_SESSION_SECRET`.
- Se agrego `NODE_OPTIONS=--max-old-space-size=6144` para el build de Firebase App Hosting.
- Se corrigio `HeroSection` como componente cliente para evitar el prerender roto de `/landing/paquete-bodas-2026`.
- Se corrigio el boton "Exportar Resumen PDF (Proximamente)" para imprimir/guardar PDF desde servicios contratados.
- Se corrigio `planPagos` para:
  - respetar limites por meses hasta el evento,
  - no duplicar el porcentaje llave,
  - no generar cuotas por encima del total contratado,
  - completar correctamente planes pagados al total.
- Se amplio cobertura de tests de planes de pago.
- Se hizo mas robusto el smoke E2E de login ante compilacion en frio de una app grande.

## Validacion ejecutada

- `npm run typecheck`: OK.
- `npm run lint`: OK con warnings existentes de hooks/imagenes.
- `npm test -- --runInBand`: OK, 92 suites y 794 tests.
- `npm run build`: OK, 255 paginas generadas, build standalone completado.
- `npm run test:e2e`: OK, 6/6 en desktop y mobile.
- Verificacion visual local:
  - `/login`: OK, password visible y boton habilitado.
  - `/simulador-de-presupuesto`: OK, portada visible, sin overflow, escritura visible en nombre y telefono.
  - `/landing/paquete-bodas-2026`: OK, hero y CTA visibles, sin overflow.
  - `/api/health`: OK.
- `npm run graphify:update`: OK, 6422 nodos, 22472 relaciones, 281 comunidades.

## Validacion bloqueada por ambiente local

- `npm run quality:security` no pudo correr porque Firebase Emulator requiere Java y el equipo local no lo tiene en `PATH`.

## Riesgos conocidos

- `npm audit --omit=dev` queda con 74 vulnerabilidades transitivas: 67 moderadas y 7 altas. Ya no queda el critico directo observado al inicio. Lo pendiente esta concentrado en Genkit/OpenTelemetry/Firebase/PWA y requiere una PR dedicada porque `npm audit fix --force` propone cambios mayores o regresivos.
- El build local completo tarda alrededor de 14 minutos en compilacion optimizada. La PR sube el heap de build para evitar OOM en Firebase App Hosting.
