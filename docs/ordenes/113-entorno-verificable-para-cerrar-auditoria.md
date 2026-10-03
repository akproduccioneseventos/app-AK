# 113 - Claude: desbloquear el cierre de la auditoria, sin repetir lo hecho

## Alcance

Esta orden no pide reprogramar modulos ni compilar lo mismo otra vez si ya existe
un artefacto valido. Codex revisa; Claude prepara/compila el entorno y entrega
evidencia del conjunto. Gemini sigue la orden 111 de devolucion de la PR 1251.
No fusionar esta documentacion sola ni usar GitHub Actions con facturacion
bloqueada como señal de falla de la app.

Main comprobado: `39da52a33fcdda83f7575d6751a9bc101b3484cf`.
PR 1251 consultada: HEAD `ea2cb46d732b815492ee5c176cd9ea6e61e867de`.
No confundir la version publicada 39da52a con una entrega pendiente no fusionada.
Actualizar los SHA antes de preparar el entorno si cambia la tanda.

## Bloqueo comprobado, no supuesto

En el host de Codex no existe `C:/Users/Usuario/Desktop/app/app-AK`.
El checkout `C:/Users/Usuario/Documents/Codex/2026-05-28/quiero-que-tomando-el-chat-de/.audit-cobros-1254`
no tiene `.next/BUILD_ID`. El GET a `http://127.0.0.1:3300/api/health`
devuelve conexion rechazada. El servidor Next dev anterior reiniciaba por memoria;
no se usara para adjudicar esos timeouts al producto ni certificar produccion.
La web publicada si responde y corresponde al SHA de arriba.

1. Entregar un entorno aislado COMPILADO accesible desde este host o el artefacto
   de la compilacion ya aprobada, con su SHA y pasos para ejecutarlo. El proyecto
   ya usa `output: 'standalone'` en `next.config.js`; reutilizarlo si sirve.
   No enviar `.env`, claves privadas, cookies reales ni datos de las 19 fiestas.
   No basta decir "lo tengo en mi maquina": registrar una respuesta observable
   del endpoint que Codex pueda alcanzar y el commit que atiende.
2. Reutilizar `scripts/entorno-de-pruebas.mjs`, su sembrado y
   `playwright.entorno.config.ts`. Datos sinteticos y tres roles: organizador,
   cliente e invitado. No introducir dependencias de auditoria en produccion.
3. Storage/Firestore deben tener un backend de PRUEBA funcional para captura y
   reconexion. Una clave ficticia o un flag `AK_ENTORNO_AISLADO` no lo reemplazan.
   Registrar modo de persistencia; prohibir escrituras a la base de produccion.
4. Entregar resultados JSON por caso con SHA/ambiente y trazas solo de los fallos.
   Separar aprobados, fallados y no ejecutados. Los saltados no se cuentan como
   aprobados; no ajustar expectativas para ocultar el defecto.

## Continuacion, en este orden y reutilizando la evidencia

- Primero repetir los tres casos dudosos: entrega de fotocabina al reconectar,
  rechazo de contenido con sesion de estacion funcional y stock 10/cantidad 12.
  Revisar respuesta, cola/persistencia y estado de pantalla. Las razones y
  descartes estan en el informe 64 de `codex/auditoria-integral-20261002`.
- Completar los **434 de 480 casos de escritorio no ejecutados** en esa corrida.
  No empezar desde cero los 46 ejecutados: contrastar cambios de fuente y fixtures
  antes de decidir si necesitan repetirse. Dividir la corrida para no perder
  resultados si una tanda falla.
- Ejecutar la matriz movil que falta y el recorrido separado de rutas
  `tests/e2e/recorrido-de-pantallas.spec.ts`. El numero 353 de su titulo no es el
  inventario actual: la sonda enumera 370 paginas y 46 API. Abrir una ruta no
  demuestra que su accion principal y sincronizacion funcionen.
- No presentar las seis aperturas publicas nuevas como seis modulos completos:
  fueron solo lectura a 390x844. `/tecnologia` lleva a login; ya pertenece a lo
  pendiente de la orden 106, no abrir un segundo encargo igual.
- Gmail/recuperacion, WhatsApp, Instagram, Gemini y Mercado Pago: evidencia de
  extremo a extremo en cuentas de prueba autorizadas. No cobrar, publicar ni
  enviar mensajes reales para satisfacer el contador. Si no se puede probar una
  integracion, conservar estado NO PROBADA y requisito exacto, no "todo bien".
- Ensayo fisico de camara, impresora, 360 y barra queda separado del software.
  Codex no puede sustituir equipos ausentes con una aprobacion de un mock.

## Pendientes ya reportados, no volver a inventarlos

AUD01/AUD02 permanecen reproducidos en 39da52a: 232 rutas fuera del mapa,
contador hipoteticamente limpio que ignora cambios en portal-cliente y CLI
Windows sin salida. Ya fueron entregados en el apartado B de la orden 111 de
`codex/auditoria-integral-20261002` (commit documental `9393f43`). Esa orden 111
es distinta de la 111 de Claude en main: no sobrescribir esta ultima. Gemini
puede incorporar ese apartado existente; no rehacer sus hallazgos ni otro panel.

PER01 sigue siendo una observacion de fuente, no una extraccion HTTP confirmada.
Claude debe probar el transporte de `getInvitados` con invitados SINTETICOS:
anonimo, cliente de otra fiesta, equipo permitido y cron permitido. No usar
invitados reales ni cambiar el QR por nombre que el dueño decidio conservar.
Su consumidor de recepcion y el cron estan verificados en el SHA actual.

Estado y evidencia nuevos: `docs/evidencias/65-retest-1254-y-pendientes.md`.
Codex no marca las 14 areas limpias sin evidencia de comportamiento vigente.

Pruebas propuestas NUEVAS, PENDIENTES de crear/ejecutar (no existen hoy):
`tests/e2e/entorno-compilado-verificable.spec.ts` debe comprobar el SHA esperado,
modo aislado y persistencia del sembrado sin usar produccion;
`tests/e2e/lectura-invitados-aislada.spec.ts` debe contrastar el transporte con
sesiones sinteticas de los cuatro roles indicados. El recorrido existente tambien
esta PENDIENTE de ejecutar completo. La sonda fuente que reproduce PER01 no es
una prueba de aceptacion del permiso ni sustituye estas pruebas de transporte.

```comprobar
archivo: scripts/entorno-de-pruebas.mjs
usa: entorno-de-pruebas.mjs en package.json
prueba: tests/e2e/entorno-compilado-verificable.spec.ts
archivo: tests/e2e/recorrido-de-pantallas.spec.ts
usa: getAllRoutes en tests/e2e/recorrido-de-pantallas.spec.ts
prueba: tests/e2e/recorrido-de-pantallas.spec.ts
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: getInvitados en src/app/recepcion/[fiestaId]/page.tsx
prueba: tests/e2e/lectura-invitados-aislada.spec.ts
```
