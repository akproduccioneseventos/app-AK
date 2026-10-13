# Correcciones directas 114 - 12/10/2026

El dueno autorizo a Codex a corregir con agentes economicos gpt-6-luna low.
Director implemento/reviso dinero, transacciones y permisos. No merge ni datos reales.
Base c6372bacb8a0e766f2946edc6f76c5b390f1ca74; PR1288 abierta;
main contrastado99faf4eb. NO CONTRASTADO CON TANDA PRIVADA CLAUDE.

## Implementado y comprobado en entorno aislado
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
-155 parcial: seis endpoints PDF locales requieren permisos de area antes de
 leer el archivo. SUELDOS laboral, CONTABILIDAD contratos/presupuestos/comprobantes.
 No existe enlace propio permitido por estos handlers que se haya eliminado;
 endpoints publicos con token separados permanecen intactos.66pruebas unitarias
 nuevas pasan;60casos HTTP y4enlaces reales con bytes identicos PASS.
 Dependencias no corregidas; no ampliar acceso publico ni permiso individual.

## Evidencia inicial
Seis suites34pruebas PASAN en arbol de trabajo; aun no certifican SHA ni pantalla.
Types inicial agoto heap2GB; segunda encontro unit string|undefined, corregido.
Fuente congelada e5f22b53f5538f7331620e6e80bfe430e49e7e2b:
build, TypeScript, lint y acentos2794archivos PASS. Build no omite lint/tipos.
Conserva warnings previos face-api, hooks, img y Browserslist; no fueron ocultados.
Jest final696suites4229tests PASS,0fallidos/0omitidos. La corrida pre-guard de696suites
4229tests tambien paso, pero no certifica el guard final de costo negativo.
Este guard rechaza el monto negativo antes de convertirlo en mantenimiento gratis.
FullJest previo:695suites4163tests PASS; seis handlers cambiaron durante esa corrida,
por eso NO se usa como validacion final del nuevo SHA. Se conserva pre-documentos.
Corrida inicial con ambiente SDK incorrecto produjo timeouts y se interrumpio;
restauracion de archivos byte a byte PASS. Repetida sin credenciales reales paso.
Evidencias112/113 originales intactas como reproduccion del fallo.

## Aceptacion actual114
90criterios PASS sobre e5, no90modulos auditados:
-6mantenimiento PC/Pixel7: negativo sin escritura; HTTP200 perdido y recarga no
 duplican; dos operadores conservan ambos registros y gastos.
-14costos PC/Pixel7: cancelar/error/reintento, recetas kg-g, stock, menu ajeno,
 precio de venta y consumidores reales; cerrar/reabrir pestaña trasHTTP200 perdido
 no aplica el porcentaje otra vez.
-2incidentes PC/Pixel7: borrador fallido conservado, nuevo caso limpio, contexto
 y responsable conservados, dos registros distintos.
-4titulos,8muestras cortas/largas: sin overflow, Guardar y Volver pulsados realmente,
 datos persistidos y recargados. Sonda inicial click-trial conservada pre-guardar.
-64documentos:60por perfiles/sesion/firma y4enlaces reales. Dueno200; secretaria
 financiero200/laboral403; perfiles limitados403; anonimo/vencido/firma alterada401.
 Respuesta PDF exacta desde servidor; no simularla con bytes de la prueba.
114-aceptacion.json/114-validacion-final.mjs verifican SHA/checks/limpieza/hashes.
Jest/logs voluminosos gzip; lector admite gzip. Hashes texto normalizados a LF.
Fixtures restaurados byte a byte; base demo vacia; servicios propios detenidos.
Exit1 al detener start/emulator es intencional, no fallo de la app.
Errores del ensayo conservados/excluidos: cookie sin expires y visor PDF sin cuerpo
CDP. Solo sonda corregida; route.fetch toma respuesta real del enlace y la reenvia.

## Limites
Ajuste seguro aborta sin cambios con mas de498 insumos, costos invalidos o fuera
de precision segura; no divide silenciosamente la operacion.
Operacion en curso requiere reintento de su iniciador con identidad conservada.
Mantenimiento conserva identidad ante recarga de la misma pestaña; cerrarla elimina
sessionStorage. Ajustes de costos usan localStorage: cerrar y reabrir no pierde su ID.
No certificar toda app, Hosting, servicios OAuth ni equipos fisicos.
Control adicional pendiente: ajustes_costos_insumos no figura en BACKUP_COLLECTIONS
ni FILE_TO_COLLECTION de firebase-sync. El recorrido actual de ajustes se prueba
en114, pero no se certifica su respaldo/restauracion. Verificar round-trip y resolver
en la siguiente tanda; no presentar todo el area costos como limpia.

## Grafo y siguiente alcance
Graphify incremental completo sobre e5f22b53:14127nodos,42925relaciones,
882comunidades; extraccion de codigo sin llamadas a modelo. No reconstruccion total.
Agente Luna acotado verifico lock sharp0.34.5/libvips1.2.4 y consumidores next/image.
Director contrasto fuente oficial de los tres avisos existentes de155:
https://github.com/advisories/GHSA-f88m-g3jw-g9cj
https://github.com/advisories/GHSA-rgj7-g3m4-5g8c
https://github.com/advisories/GHSA-wq5f-xc86-pv6w
https://sharp.pixelplumbing.com/changelog/
Esto prepara la siguiente tanda; dependencias siguen SIN actualizar en114.
