# 134 - Recuento y conciliacion de cobertura

## Resultado de la tarea 4

Se completo el recuento documental y estructural pedido, no una nueva auditoria funcional de toda la app. No se programo, compilo, publico ni fusiono la app. No se marcaron areas limpias desde referencias de archivos.

- Fuente actual inventariada: `7230f9d02b32805952a185f704a0208bd5d643e6` (main observado).
- Documentos historicos indexados en ese mismo SHA: 2026; ninguno sin expandir.
- Ultima evidencia nativa recuperada: build `a635b27071ecea22092eba2a285892c84c6f9d08`, equivalente al main ANTERIOR `9aa64f99` en los archivos de runtime contrastados, no al main nuevo `7230f9d0`.
- PR1320 fue cerrada sin fusion directa; Claude integro una parte mediante PR1323. Esta propuesta recupera los recibos finales RSVP/QR y sus pruebas, que aun faltaban en main, sin copiar la rama antigua ni reemplazar codigo de la app.
- PR1321/1322 tambien aparecen cerradas e integradas en la historia de main. La presencia de sus correcciones no equivale a retest aprobado por Codex.
- NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI: su HEAD privado no se conoce; solo se contrasta lo publicado en Git.

## Recuento sin inflar cobertura

| Concepto | Resultado | Que demuestra |
| --- | ---: | --- |
| Areas fijas | 14 | Todas incluidas en el indice |
| Rutas `page`/`route` de Next | 421 | Todas asignadas una vez como propiedad primaria |
| Rutas sin asignar / asignaciones inexistentes | 0 / 0 | Coherencia del inventario, no funcionamiento |
| Rutas declaradas en mas de un area | 8 | Se conservan las pertenencias compartidas sin sumar dos veces |
| Archivos estructurales alcanzados | 1412 | Imports locales literales y limites de pagina/layout |
| Ubicaciones AST interactivas candidatas | 6401 | Incluye enlaces, entradas y handlers; no son 6401 botones ni pruebas |
| Corridas nativas archivadas | 29 | Conserva tambien intentos fallidos y repetidos |
| Ejecuciones de casos | 216 | 160 passed, 13 failed, 19 timedOut, 24 skipped; NO son 32 bugs |
| Firmas distintas titulo/prueba/proyecto | 168 | Desduplica reintentos nombrados; no equivale a funciones unicas |
| Ejecuciones con fuente exacta del test disponible | 164 | Hash de la fuente comprobado; las otras no se reconstruyen por suposicion |
| Rutas asociadas a escenarios nativos historicos | 68 | Asociacion desde declaraciones del test; no prueba cada rama o control |
| Enlaces historicos documento/ruta | 10815 | Referencias para recuperar trabajo previo; no aceptaciones |
| Perfiles reales de autorizacion | 7 | dueno, secretaria, operador, personal, cliente, prospecto, invitado |

El metodo anterior 131 contaba 4633 ubicaciones AST. El actual incluye limites de layout, imports dinamicos literales y mas tipos de handlers; la diferencia NO es un descubrimiento de miles de errores o funciones nuevas.

## Las 14 areas

La columna historica asocia declaraciones de navegacion a casos ejecutados, incluidos resultados no aprobados. No exige repetir todas esas rutas: primero se revisan el recibo, sus aserciones y `consumerDifferences`.

| Area | Rutas primarias | Con enlace nativo historico | Alcance que debe conservarse / limite principal |
| --- | ---: | ---: | --- |
| Cobros, cuotas, facturas y recibos | 56 | 7 | Recibos 124/128/130/133; no reabrir politica de ingresos/cuotas enteros |
| Contrato, sena y firma | 13 | 1 | Contrato ya tuvo recorrido; defecto movil171 y firma no equivalen a area completa |
| Menus, compras e insumos | 12 | 4 | 166 focal aprobada; cocina antigua acepta error/impresion condicional y no prueba datos completos |
| Ingreso, sesiones y permisos | 15 | 2 | Sesion sintetica general no demuestra cada perfil ni operaciones denegadas |
| Fiesta, invitados y confirmaciones | 104 | 14 | RSVP/personal/red social con recibos; 3D inconcluso, cambios DJ requieren contraste |
| Portal del cliente | 23 | 8 | Ya auditado en132/133; mensajes/RSVP/menu/musica parciales, no todo el portal |
| Invitacion y pantallas del invitado | 7 | 2 | RSVP y QR descargado/lector comprobados en a635; no camara fisica ni offline |
| Web publica, blog y simuladores | 49 | 12 | Conserva viaje comercial/CRM/UTM; movil del viaje presupuesto omitido,173 es test antiguo |
| Instagram, YouTube y galeria | 10 | 1 | Historial y lecturas parciales; sincronizacion real requiere permisos/proveedor reales |
| Entretenimiento y estaciones | 51 | 10 | Totem/puerta/QR con alcances separados; no certifica cada equipo y dispositivo |
| Barra de tragos | 0* | 0* | 132 ya audito pedidos listos; cambios170 presentes en main, retest no incluido aqui |
| Asistente AK y WhatsApp | 30 | 2 | Recuperar recibos previos; personas de la IA no son perfiles de autorizacion |
| Personal, llegada y recibos | 9 | 1 | 166 y operacion133 parciales; no confundir con agenda ni GPS real |
| Tareas automaticas y avisos | 42 | 4 | 166 focal aprobada, historial conservado; no ejecucion real de cada proveedor |

*Barra no tiene carpetas UI propias en el registro de areas: sus ocho rutas relacionadas se asignan a otras areas. Estan expresamente listadas en `areas[].namedBarUiRoutes` del archivo completo: menus/tragos, barra-tecnologica, carta-tragos y cinco entradas bajo evento/barra. No significa que no tenga pantallas o auditorias. Los 287 consumidores estructurales de su codigo compartido tampoco son 287 pantallas de barra.

## Vigencia y lo que realmente queda

1. **Contrastar el delta nuevo, no reiniciar toda la auditoria.** Main cambio de9aa a723 durante este trabajo. Se conservan las pruebas de a635 como historicas y se enumeran dependencias actuales modificadas por caso. Este recuento no ejecuto tests sobre723; por eso el contador conservador de enlaces nativos de fuente identica es cero. No significa cero pruebas hechas ni que las421rutas deban probarse de nuevo.
2. **Cerrar los huecos especificos ya documentados.** 3D sigue inconcluso por cierre/trazas; agenda necesita su comprobacion de consola aislada; cocina necesita comprobar evento/datos realmente cargados y la salida de impresion. No contar el test debil de cocina como prueba completa. Retest de171/172 solo cuando exista correccion contrastable;169/170 ya tienen cambios en main, no otra orden duplicada.
3. **Completar la trazabilidad donde no existe.** Las6401ubicaciones AST no tienen un registro individual de accion/resultado/perfil. Cero controles aceptados individualmente significa falta de ese registro, NO que ningun boton se haya usado. Antes de crear un test, leer las pruebas/capturas enlazadas: pueden cubrirlo sin nombrarlo en un ledger.
4. **No convertir lo externo en aprobado virtualmente.** Hosting/OAuth, modelo y voz reales,19documentos originales, integraciones con cuentas reales y equipos fisicos quedan separados. Este informe no los probo ni los considera errores automaticamente.

No hay un porcentaje funcional honesto calculable solo con estos inventarios. Las areas no se aceptan por tener referencias, y tampoco se rechazan por faltar un enlace automatico.

## Como continuar sin repetir

1. Buscar ruta o archivo en `134-rutas.csv`; consultar su fila en `134-conciliacion-completa.json.gz`.
2. Recuperar `history`, `references128`, `historicalReferenceIds`, `nativeCaseIds` e `historicalNativeCaseIds`. Las referencias de inventario/documentacion no son pruebas.
3. Abrir el recibo y sus aserciones exactas. Un `goto` declarado dentro de un test aprobado no demuestra que se ejecutaran todas sus ramas; una prueba condicional que acepta un error no demuestra datos cargados.
4. Contrastar SHA/consumidor/dependencias. `consumerDifferences` es una ayuda estatica, no una demostracion de equivalencia transitiva completa. Reutilizar el alcance vigente; probar solo cambios o falta real de evidencia.
5. Distinguir mejora, decision del dueno, mantenimiento del test, limite QA y defecto reproducido. No reabrir174 ADC: fue retractado;175 es propuesta editorial, no fallo funcional;173 es mantenimiento de test.

Las etiquetas Caja/Ventas/Marketing/Eventos/Fiesta/Agenda del historial describen agentes IA, no los siete perfiles de seguridad. Cliente con clave, invitado con enlace, proveedor con token y operador de estacion tambien requieren su propia evidencia de autorizacion, no solo llegar a una URL.

## Reproduccion y validacion de este recuento

```powershell
node docs/evidencias/134-conciliar-cobertura.mjs --tools-root C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103
node docs/evidencias/134-validar-conciliacion.mjs
```

Se usa la captura congelada `134-recibos-nativos.json.gz`, no se vuelven a ejecutar sus pruebas. El generador lee blobs inmutables de Git y no inicia la app. El validador comprobo hashes, pertenencias, rutas/dependencias existentes, conteos de Playwright, fuentes de tests disponibles y referencias de casos. Resultado observado: `PASS_RECONCILIATION_134_ONLY`.

Archivos de entrega: manifiesto `134-conciliacion.json`, detalle comprimido `134-conciliacion-completa.json.gz`, rutas CSV, perfiles `134-roles.json`, alcances curados `134-recibos-recientes.json` y captura nativa congelada. Las fuentes historicas se conservan, no se corrigen para ocultar fallos. No se ejecuto build/lint/typecheck ni una nueva validacion funcional: esta entrega es exclusivamente de auditoria/documentacion.
