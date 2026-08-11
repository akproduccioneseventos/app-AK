# Estado actual de app-AK

Ultima actualizacion: 11 de agosto de 2026.

Rama: `release/final-11ago`.
PR abierta: `#941` contra `main`.
Base publicada antes de esta continuacion: `80384e07052a4245ef70a81bc69f044859e34c11`.
Candidato validado: el `HEAD` actual de la PR #941 una vez publicado.

## Hecho y comprobado en la PR #941

- Portal LED: platos adultos, entradas, menu infantil/adolescente, cantidades y
  metodos de calculo pasan al presupuesto manual y entran en el total.
- Contabilidad: Auditoria incorpora un control de solo lectura que recalcula
  presupuestos y facturas y busca pagos repetidos, sobrepagos y vinculos rotos.
- Seguridad: controles de pantalla limitados a la fiesta asignada; aprobaciones,
  agenda social, Google Workspace, Mercado Pago y crons protegidos en servidor.
- Muro social: fotos y videos quedan pendientes de moderacion por defecto.
- WhatsApp: el cron de recordatorios mantiene su acceso interno sin abrir el CRM
  ni aceptar secretos en la URL.
- Google Workspace: una secretaria puede sincronizar la fiesta que organiza; la
  sincronizacion masiva y la cuenta corporativa siguen reservadas al dueno.
- Marketing: no se marca una publicacion como enviada a una red externa si el
  proveedor no respondio realmente.
- Rendimiento: la portada publica vuelve a ISR de cinco minutos.
- Mercado Pago: consultar una sesion no genera un acceso nuevo al presupuesto.

## Evidencia del mismo commit

- TypeScript completo: aprobado.
- Lint de archivos tocados: aprobado, sin errores ni advertencias.
- Jest focalizado: 13 suites y 143/143 pruebas aprobadas.
- `git diff --check` y busqueda de secretos: aprobados.
- Graphify: 7.801 nodos, 28.664 relaciones y 377 comunidades.
- PR #941: GitHub la informa fusionable y sin conflictos.

## Limitaciones aceptadas

- Los checks de GitHub no comienzan porque la cuenta esta bloqueada por
  facturacion. El dueno no desea agregar una tarjeta. No investigarlo como error
  de la app ni crear PR para cambiarlo.
- Los 19 eventos reales no estan en los JSON locales. La comprobacion contable se
  hace dentro de la app conectada a Firebase con `Auditoria > Revisar ahora`.

## Evidencia adicional de lanzamiento

- Build Next de produccion utilizable: 265 paginas; el artefacto actual inicio con
  `next start` y quedo disponible en 5,6 segundos.
- E2E interno de produccion: 3/3. Carga panel, contabilidad, pagos rapidos,
  presupuestos, clientes y eventos; tambien valida portales del planificador y
  que el token de proveedor no exponga datos ajenos.
- Autenticacion e integraciones: 9 suites, 42/42 pruebas focalizadas.
- Firestore Emulator: 20/20 reglas aprobadas; los rechazos esperados aparecen
  como `PERMISSION_DENIED` en el registro.
- Simulador comercial: 6/6 recorridos PC/celular, incluido PDF formal y ajuste
  para evento de ano futuro.
- Portales publicos e invitado: portal cliente, invitado individual, RSVP, QR,
  clave, sincronizacion con equipo y ausencia de acceso administrativo.
- Entretenimiento: operador, fotocabina con camara simulada, capsula, espejo IA,
  muro, barra, carta de tragos y totem recorridos en los tamanos aplicables.
- Visual movil: los accesos flotantes ya no cubren la galeria y ocupan 48 px de
  alto; no se detecto desborde horizontal en la matriz publica recorrida.
- Rendimiento observado: la portada usa ISR de cinco minutos; seis rutas internas
  y dos portales protegidos completaron la tanda productiva en 53,3 segundos. La
  compilacion lenta del modo desarrollo no se cuenta como rendimiento publicado.

## Pendiente de comprobacion real

- Ejecutar `Auditoria > Revisar ahora` con Firebase productivo para comprobar los
  19 eventos, presupuestos, facturas y pagos que no existen en los JSON locales.
- Confirmar con credenciales reales el envio de Gmail, publicacion de Instagram,
  cobro de Mercado Pago y generacion Gemini. Las rutas y permisos estan probados;
  la respuesta del proveedor no se inventa.
- Probar en el salon impresora, camaras/tablets reales, codecs, brazo 360 y red del
  evento. El navegador simula esos dispositivos, no reemplaza la prueba fisica.
- Los checks de GitHub siguen bloqueados por facturacion; es una limitacion
  aceptada y no una deuda tecnica que deba ocultarse con codigo.

Todo fallo nuevo debe reproducirse primero, corregirse en esta misma rama y
anotarse en `docs/YA-RESUELTO.md`. No repetir la auditoria mientras el SHA no cambie.
