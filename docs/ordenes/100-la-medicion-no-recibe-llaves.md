# 100 - La medicion no recibe llaves del invitado

Fecha: 2026-09-29. Responsable: Claude (privacidad/permisos); Codex revisa.
No es una nueva funcionalidad. Incorporar en la tanda de correcciones, sin fusionar esta documentacion sola.

## Versiones contrastadas

- Main inspeccionado: 62dcb2cb4df718a81c3654028199e49628367d8c.
- PR abierta detectada al cierre: #1246, feat/orden-99-devolucion-y-entrega-final, HEAD 70b016ece91b8e82e7b2054061a8c8f2af072e19.
- Su base es claude/revision-entrega-96-98, no main.
- Se leyo google-analytics.tsx en ambos SHA: conserva el mismo efecto que concatena pathname y window.location.search.
- Clasificacion: reproducido con componente real de main en sonda aislada; codigo causante tambien presente en la tanda. No se comprobo trafico real hacia Google ni el SHA publicado hoy. Volver a contrastar si cambia HEAD antes de programar.

## P1: una llave privada entra en la medicion

src/components/google-analytics.tsx, GoogleAnalytics, lineas 22-26: pasa la URL con consulta completa a window.gtag('config', gaId, {page_path:url}).
Consumidor real: src/app/layout.tsx, import linea 13 y montaje linea 141.
src/lib/guest-portal-public-data.ts: hasPublicGuestAccess (90-100) compara guestAccessToken; el constructor rechaza acceso invalido en 179. No es un parametro de marketing.

Sonda ejecutada sobre el componente TypeScript real, transpilado y ejecutado con useEffect, pathname y gtag simulados; sin red ni secretos reales:
entrada: /invitacion/audit-fixture/invitado/audit-guest?token=TOKEN_FICTICIO_AUDITORIA
salida: ["config","G-TEST-ONLY",{"page_path":"/invitacion/audit-fixture/invitado/audit-guest?token=TOKEN_FICTICIO_AUDITORIA"}]
tokenForwarded: true. El codigo de salida 1 es el fallo esperado de esta comprobacion, no un fallo de infraestructura.
Sonda local: .audit-tools/probe-analytics-62dcb2c.cjs; resultado .audit-tools/analytics-62dcb2c-result.json, externos a la app.

Las 7 pruebas existentes de src/__tests__/el-pixel-y-la-medicion-existen.test.ts PASARON sobre main (Jest, 1 suite, 3.758s). Revisan presencia/configuracion, no esta frontera de privacidad. Que pasen no descarta el hallazgo.

## Correccion pedida

1. No pasar llaves de invitado, acceso de portal, identidad ni parametros arbitrarios a proveedores de medicion.
2. Revisar URL inicial, navegacion SPA, page_path, page_location, referrer y demas etiquetas presentes. Limpiar un unico campo no basta si otra etiqueta lee la URL original. No afirmar fuga de Meta sin probarla.
3. Conservar medicion comercial segura y atribucion aprobada, con lista explicita de campos permitidos. No desactivar ventas ni cambiar acceso del invitado.
4. Probar token ficticio en carga directa y cambio de ruta: ninguna solicitud de medicion debe contenerlo, tampoco codificado. Incluir secretos en segmento de ruta si esa ruta los usa.
5. Registrar prueba, SHA y resultado; Claude compila el conjunto. No escribir "desplegado" por aprobar un test.

## Limites y estado

No se modifico codigo de aplicacion. No se enviaron tokens reales.
El entorno local del SHA actual fue sembrado con una prueba aprobada y el servidor inicio, pero CUA bloqueo seleccionar la pestana con error de politica de navegador: "The requested URL protocol is not allowed. Allowed protocols: http:, https:". No se intento eludirlo ni se cuentan recorridos visuales como aprobados.
Las pruebas de aceptacion nuevas siguientes son PROPUESTAS, no existen ni se ejecutaron en esta auditoria.

```comprobar
archivo: src/components/google-analytics.tsx
usa: GoogleAnalytics en src/app/layout.tsx
prueba: tests/e2e/medicion-no-envia-llaves.spec.ts (PROPUESTA PENDIENTE)
```
