# Codex118 - Orden161 corregida y contrastada, no certificado de toda la app

Fuente final662f123d41c59f6e802384322b10049b913fb416, rama de PR1293.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE. No fusionada ni publicada.
Gate reproducible118-validacion-final.mjs, resultado118-aceptacion.json.

## Que cambia

- Configurador: clave UUID por intento guardada antes de enviar. Se conserva ante
  fallo/respuesta perdida/recarga; solo hash y UUID, no nombres ni telefonos.
  Si falla el almacenamiento, no enviar un intento que no se pueda recuperar.
- savePresupuesto conserva su API anterior; operationId opcional activa la
  creacion atomica del documento y numero, con identidad del actor y carga.
  Un retry devuelve el mismo ID, sin repetir CRM/notificacion ni pisar cobros.
  Clave invalida o carga distinta se rechazan, no se sobrescribe el documento.
- Nueva cotizacion deliberada genera otra clave: no deduplicar por telefono,
  nombre, invitados ni total. Dos presupuestos iguales siguen disponibles.
- Si CRM no se confirma, el presupuesto queda guardado y se avisa; no fingir
  sincronizacion ni repetir a ciegas el prospecto. El vinculo se actualiza por
  documento, conservando cambios de contabilidad concurrentes.
- Operador sigue sin cobros en la respuesta, tanto primera como repetida. La
  notificacion usa el numero realmente confirmado. No cambian importes/permisos.

## Evidencia observada en la misma fuente

Build PASS (incluye tipos/lint);731suites4564tests PASS,0omitidos/0fallos;
acentos2851 PASS. No se borro ni se flexibilizo el esperado2 de117.

PC y Pixel7, Next compilado y Firestore demo real:
- Cortar antes de enviar: retry guarda uno, total850; boton real abre documento
  visible en /presupuestos/<id>/ver, que sigue visible tras recarga.
- Perder solo ACK despues de guardar:2antes y2despues, no3; timeline CRM no
  cambia en retry. Pixel7 recarga el modulo antes de repetir el guardado.
- Nueva cotizacion mismo nombre/telefono/datos: tres documentos totales, dos
  legitimos del mismo prospecto, numeros1/2/3, IDs distintos y documento visible.
Son6flujos PASS mas2observaciones de hitbox; NO8aprobaciones de estetica.
Desktop conserva friccion152:2/3puntos cubiertos por indicador; foco disponible.
Movil3/3libres.152 no cerrada por este arreglo.

SDK0 despues de parar app, dos servicios propios apagados, bytes restaurados;
archivo marketing ajeno conserva SHA esperado. No datos/cuentas/cargos/mails
reales, QA privada sin credenciales, Whatsapp sin proveedor configurado.

Graphify local:14499nodos43709relaciones915comunidades, CLI sinLLM.25avisos
del parser AST parcial no son erroresTypeScript; el build real paso. Grafo local
ignorado por Git, no entregado como base de datos remota.

## Incidentes del auditor, conservados

- Prototipo06c compilo, pero nuevas regresiones encontraron dos defectos propios:
  cobro concurrente en respuesta inicial al operador y numero antiguo en aviso.
 118-focal-prototipo-fallos.json conserva2FAIL/26PASS; corregidos,28focalizadas
  PASS y validacion amplia sobre662. Primera compilacion no certifica662.
- Tipos iniciales: payload nuevo inferia descuentoTipo:string. Corregido con
  literal;117-types-inicial-execution/log conservados, build final verifica tipos.
- Primera sonda nueva certificaba URL pero no esperaba el redirect /ver ni
  documento visible.118-nativo-url-solamente.json conserva ese alcance. Se
  ampliaron solo criterios QA, sin tocar app: repetir6flujos confirma documento
  real, persistente tras recarga. No confundir cambiar de direccion con funcionar.
- API Graphify update no admite --code-only; se uso update ., explicitamente
  sinLLM. No instalar dependencias de herramientas en produccion.

## Limites y siguiente trabajo

No cerrar toda contabilidad/14areas ni certificar0errores. Otros consumidores
legacy de savePresupuesto no obtienen esta proteccion sin enviar operationId;
118-consumidores-a-contrastar.md los enumera como RIESGOS, no defectos probados.
No prometer numeracion atomica de TODOS los escritores legacy por esta variante.
Siguiente: probar primero guardado manual con ACK perdido y nuevas cotizaciones;
contrastar YA y tanda antes de corregir. Juntar en PRabierta, no PRporcaso.
Luego152, deps pendientes y conciliacion funcional109. Sin sello Hosting/OAuth/
19presupuestos originales/hardware ni decisiones de misiones/trivia/votos/caja.
