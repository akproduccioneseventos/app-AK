# Orden 54: portal cliente, privacidad y guardado real

2026-09-09. Codex revisa, Gemini programa, Claude Opus compila. No fusionar.
Base de codigo main 8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe, confirmado vigente.
Auditoria PARCIAL: dos grupos de defectos reproducidos; NO corregidos.
Entrega documental en codex/ordenes-45-a-48, no main.

## Evidencia

Se reutilizaron Graphify, YA-RESUELTO y ordenes 51-53. No hubo sesion autorizada ni
recorrido visual nuevo: el bloqueo de ingreso sigue documentado en orden53.
El agente para pagina publica del evento agoto su limite antes de entregar resultados;
esa parte queda PENDIENTE, no se cuenta como auditada ni se lanzaron mas agentes.

Se ejecutaron funciones reales extraidas por AST, con evento ficticio, IO y sesion
simulados, sin Firebase real, pagos, notificaciones reales ni build de la app:

```powershell
node docs/evidencias/54-sondas-portal-cliente.cjs C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

Resultado: 4 FAIL y 1 PASS, salida 1. Son fallos reproducidos, no cuatro modulos nuevos.
PASS: la proyeccion existente sigue eliminando la clave de acceso. Conservar eso.

## PORTAL-01 / P1: cambios que no quedan pero generan avisos

`src/app/actions/fiesta/portal.actions.ts:44` ignora success:false de saveFiesta y
updateFiestaData devuelve true. updateClientChecklistItem luego avisa al organizador.
La sonda recibe success:true y una notificacion pese al guardado fallido.
Consumidor real: `src/app/portal/page.tsx:378`, que SI comprueba result.success;
no rehacer su rollback, corregir la respuesta servidor. Misma familia de helper en
notas, musica, lista de lo que llevar y otros cambios; revisar dependencias directas.

Gemini: propagar errores, no notificar antes de persistir. Probar marcar/desmarcar,
notas y musica con fallo, reintento y recarga; comprobar que llegan al organizador.
Conservar controles de sesion por fiesta e idempotencia. Coordinar con orden51 para
no reemplazar sus correcciones de concurrencia con otra escritura completa.

## PORTAL-02 / P1: itinerario interno llega al cliente

`src/lib/client-portal/public-fiesta.ts` copia programa sin filtrar. Tanto
getFiestaByAccessKey como getFiestaForPortalSession usan ese mapper. La pagina
`src/app/portal/c/[accessKey]/page.tsx:79` vuelve a pasar programa completo.
El consumidor ACTIVO es PublicPortalClientExperience: :675 mapea TODOS los items,
incluso visibleParaCliente:false, y :1411 los renderiza. Ademas utiliza descripcion
como respaldo cuando falta descripcionCliente. La sonda confirma que un momento
privado y su nota interna llegan a la proyeccion y al listado del cliente.

Gemini: filtrar en servidor segun visibilidad y proyectar SOLO campos destinados al
cliente. En elementos visibles, no usar notas internas como respaldo silencioso.
Respetar compatibilidad de datos viejos: determinar la regla ya aprobada para
visibleParaCliente ausente; no ocultar de golpe todo el itinerario ni publicar todo.
Revisar programa/timeline y rutas publicas relacionadas sin ampliar permisos.
Probar dos eventos aislados y un item privado con texto centinela: ausente tanto del
HTML como del payload/estado cliente, no solo escondido con CSS.

## No repetir falsos positivos

PublicPortalView.tsx tiene un filtro de visibilidad, pero NO es el consumidor que
importa page.tsx. Probar ese componente viejo no certifica el portal activo.
No reportar sus botones como fallos visibles sin confirmar una ruta que los use.
Mantener el filtrado ya existente de claves, costos y datos privados de invitados.
La correccion del PDF de itinerario no cubre por si sola el payload del portal.
No mezclar demo /portal-cliente con el enlace real /portal/c al evaluar funciones.

## Mejoras de uso y pendientes

Mostrar estado de guardado verdadero y reintento donde el cliente actua; si falla,
conservar su texto. No agregar otro panel ni una notificacion emergente por cada clic.
Priorizar pendientes que requieren respuesta del cliente sobre catalogos genericos.
Son criterios de UX a validar en navegador, no observaciones visuales ya realizadas.

Queda pendiente: pagina publica del evento, todos los permisos/modulos configurados,
contrato y descargas, pagos y cambios de fecha/cancelacion, mensajes, galeria, documentos,
recorrido de movil y sincronizacion real. No tocar dinero ni datos reales en sondas.
Lectura preliminar detecto getFiestaById/getFiestaBySlug amplios: requiere auditoria
especifica de consumidores y autorizacion; NO se hizo explotacion ni certificacion
de seguridad general. No protegerlos indiscriminadamente rompiendo invitaciones.

Gemini entrega correcciones y tests regresion. Claude registra SHA, entorno y build.
Codex valida pruebas y recorrido sobre esa version antes de cerrar. La presencia de
archivos y un build no demuestran que el cliente vea/guarde lo correcto.

E2E siguiente PROPUESTO/PENDIENTE, no creado ni ejecutado. Bloque solo de inventario.

```comprobar
archivo: src/lib/client-portal/public-fiesta.ts
usa: mapFiestaToClientPortal en src/app/actions/fiesta/portal.actions.ts
prueba: tests/e2e/portal-cliente-privacidad-y-guardado.spec.ts
```
