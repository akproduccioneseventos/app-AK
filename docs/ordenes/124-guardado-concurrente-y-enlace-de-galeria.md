# Orden 124: cuota concurrente y destino de Galería HD

## Destino y reparto

6/10/2026. Main verificado: `368988bb64e823d31c9d5c4b2fb9adc114b207ef`,
fusión #1260. GitHub no tenía propuestas abiertas al iniciar esta revisión.
Se contrastó con esa entrega, no con una versión vieja publicada.

**Claude:** CAMPO73-RACE, plata/permisos y compilación. **Gemini:** GAL73,
después de la decisión del dueño. Codex registra y retesta; esta orden no inicia
otras IA. Una tanda de código con órdenes 122, 123 y 124 pendientes; no una PR
por hallazgo ni una fusión documental sola. No ampliar permisos ni cambiar
reglas comerciales para hacer pasar las pruebas.

## A. CAMPO73-RACE, P1: el permiso se comprueba antes de guardar

**Área: plata/permisos. Commit: `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.**

La orden 122 sí corrigió los cambios explícitos de cobros sin contabilidad.
Sus 21 pruebas pasan. Este caso es distinto: llega el mismo plan de pagos que
estaba guardado, así que `pideCambiarLaPlata` lo autoriza; antes del `set`, otra
persona cobra la cuota; después se guarda el plan viejo y se borra ese cobro.
En `saveFiesta`, `reponerLaPlata` también repone desde una lectura anterior al
guardado. No reimplementar los arreglos directos de CAMPO01/02 ni COMPRA01.

**Reproducción aislada ejecutada:**

```text
node docs/evidencias/73-guardado-concurrente-probe.cjs
```

1. Operador asignado sin contabilidad, o cliente con sesión de su portal.
2. Cuota de 1.000 pendiente; guardar un cambio legítimo de organización junto
   con el plan idéntico al leído, o guardar la fiesta completa.
3. Intercalar un cobro de 1.000 inmediatamente antes de guardar en la base.
4. Respuesta `success:true`, pero `montoPagado` vuelve a cero.

Son cuatro variantes del mismo defecto, no cuatro causas. Control negativo:
si el guardado parcial no manda el plan, el cobro de 1.000 se conserva. La sonda
ejecuta acciones y `syncToFirestore` reales del SHA; sesión/lecturas y el
`document.set(..., {merge:true})` son simulados. No se ejecutó un cobro real.

**Rutas comprobadas:** `src/app/actions/fiesta/fiesta.actions.ts`:
`saveFiesta` 270-295, `updateFiestaPartial` 297-331, helpers 128-183;
`src/lib/firebase-sync.ts` 393-406: el documento individual se guarda con
`set` sin una comprobación transaccional de estos campos. Consumidor real:
`updateConfiguracion` en `src/app/actions/fiesta/configuracion.actions.ts`,
por `updateConfiguracionFiestaActual` en `src/app/actions/fiesta-actual.ts`,
llamado en `src/app/(app)/fiestas/nueva/configuracion/page.tsx:136`.

**Resultado requerido:** comprobar y conservar los campos protegidos sobre el
documento del momento del guardado, dentro de la misma operación atómica.
No basta con agregar otra lectura inmediatamente antes de un `set` separado.
Mantener cambios legítimos de organización, reposición de secretos y permisos
vigentes; no cambiar las acciones específicas de cobros por esta orden.
Agregar regresiones con los cuatro intercalados, además del control de omisión;
rojo sobre este SHA, verde sobre el arreglo. Probar también reintentos de la
transacción y un guardado legítimo contable para no romperlo.

## B. GAL73, P2: Galería HD no lleva a fotos

**Área: web. Commit del enlace: `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.**

En navegador público, Inicio → **Galería HD** abre otra pestaña en
`https://galeria.akproducciones.uy/me`: sólo tarjeta de contacto, teléfono,
WhatsApp y guardar contacto, sin fotos ni álbum. Captura:
`docs/evidencias/73-galeria-hd-destino.png`. Se comprobó el click real y el
destino, no sólo el `href`. El SHA del despliegue no fue identificado.

Fuente en main: `navLinks` dentro de `LandingNav`,
`src/components/landing/LandingNav.tsx:63`; consumidor
`src/app/page.tsx:705`. El enlace no cambió entre la última tanda y main.
La galería interna de la portada funciona; no es un defecto de sincronización
de Instagram, ni prueba de que se hayan perdido imágenes. Wfolio es externo;
su entrega manual ya está decidida y NO se pide una integración automática.

**Decisión consultada al dueño y pendiente:** conservar la galería externa
con un destino público de fotos confirmado, o llevar al bloque de galería
existente en AK. No adivinar una URL de álbum ni cambiar esa decisión por
cuenta propia. Una vez decidido, comprobar en escritorio/móvil que el botón
lleva a fotos, sin login de administrador ni tarjeta de contacto como destino.

## Evidencia y pendientes separados

- Manifest original: `docs/evidencias/73-resultados/manifest.json`.
- Orden 123 sigue pendiente: cambio de trago sin token, botones en preparando,
  reintento con ID conocido sin validar dueño y escala de plantilla del salón.
  En #1260 sólo cambió el texto de error del MiniQuiosco, no sus causas.
- RED03 / 122, sincronización concurrente de videos, sigue para Gemini.
- Pruebas nuevas propuestas abajo: **pendientes, aún no existen ni se ejecutaron**.
- No declarar el área limpia ni "cero errores" por un manifest o archivo creado.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: saveFiesta en src/app/actions/fiesta/configuracion.actions.ts
usa: updateConfiguracionFiestaActual en src/app/(app)/fiestas/nueva/configuracion/page.tsx
archivo: src/components/landing/LandingNav.tsx
usa: LandingNav en src/app/page.tsx
prueba: src/__tests__/auditoria-73-guardado-concurrente.test.ts (PENDIENTE)
prueba: tests/e2e/galeria-hd-destino-publico.spec.ts (PENDIENTE, requiere decisión del dueño)
```
