# Correcciones directas 114 - 12/10/2026

El dueno autorizo a Codex a corregir con agentes economicos gpt-6-luna low.
Director implemento/reviso dinero, transacciones y permisos. No merge ni datos reales.
Base c6372bacb8a0e766f2946edc6f76c5b390f1ca74; PR1288 abierta;
main contrastado99faf4eb. NO CONTRASTADO CON TANDA PRIVADA CLAUDE.

## Implementado, pendiente de aceptacion en navegador
-159: ID estable de mantenimiento en sessionStorage; reintento tras perdida/recarga
 reutiliza ID. Historial y bandera de gasto cambian sobre activo actual en transaccion.
 Guardado manual no borra historial; gasto conserva idempotencyKey existente.
 Payload distinto con mismo ID se rechaza; trabajos iguales con distinto ID permitidos.
-160: conservar unidad y cantidad de receta al propagar precio de compra.
 Ajuste y recibo durable juntos en Firestore; consumidor real envia ID obligatorio.
 Turno compartido hasta terminar menus; reintento lento no pisa el siguiente ajuste.
 Se conservan redondeo a pesos, stock y precio de venta explicito.
 Migracion de pendientes antiguos no multiplica otra vez.
-157: limpiar textos del incidente solo tras success; conservar contexto/elecciones
 de categoria/responsable y borrador cancelado/fallido.
-158: titulos flex reducibles con cortes de palabra en editores activo/insumo.

## Evidencia inicial
Seis suites34pruebas PASAN en arbol de trabajo; aun no certifican SHA ni pantalla.
Types inicial agoto heap2GB; segunda encontro unit string|undefined, corregido.
Build/Jest completo/tipos final/acentos/navegador: PENDIENTES.
Evidencias112/113 originales intactas como reproduccion del fallo.

## Limites
Ajuste seguro aborta sin cambios con mas de498 insumos, costos invalidos o fuera
de precision segura; no divide silenciosamente la operacion.
Operacion en curso requiere reintento de su iniciador con identidad conservada.
Mantenimiento conserva identidad ante recarga de la misma pestaña; cerrarla elimina
sessionStorage. Ajustes de costos usan localStorage: cerrar y reabrir no pierde su ID.
No certificar toda app, Hosting, servicios OAuth ni equipos fisicos.
