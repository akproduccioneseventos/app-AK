# Recuento conciliado - 26/10/2026

Fuente de app: d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0.
HEAD documental contrastado: 09b04eb193bbe47acab522108914740447da40a9.
Main: 3e45a4ac6b479f89605163168e31b37dc84f2d0f.
PR1363 ABIERTA, no borrador, base PR1362/Gemini2b17bebf.
Cambios privados no publicados NO CONTRASTADOS. No merge ni despliegue.

## Dictamen y continuidad

La matriz de correcciones de685 esta aprobada; no se repitieron build680,
canonica681 ni navegador682 sin cambios de app. Esta pasada agrega una
instalacion limpia y concilia referencias historicas que podian volver a
generar encargos duplicados. No es certificacion de cada boton/rol ni de
cero errores en toda circunstancia. No reemplaza pruebas por referencias.

## Lo auditado y corregido: evidencia que prevalece

| Asunto | Evidencia y estado |
| --- | --- |
| Filtros214: gestos, ruleta e integracion de caras | 597 ya conserva su cierre:480 ocho criterios positivos en978; no siguen pendientes las tres causas antiguas de917. Ademas681/D4 incluye `los-efectos-reaccionan-a-la-cara` 6PASS y `los-filtros-siguen-la-cara` 4PASS. No inferencia facial/hardware aceptados. |
| Barra220: contraste de pantalla de tragos listos | 597 registra captura546 legible y455 veinte ciclos/overflow PASS por su alcance. Pagina y CSS focales identicos978/D4; no seguir citando423 como fallo actual. No nueva medicion raster en esta pasada. |
| Factura221: error de lectura no es ausencia | 482 cerro la variante con ReactDOM en modo test.681/D4 ejecuta la regresion387 original:3PASS; no queda abierta por el texto viejo de253. No prueba un cobro real. |
| Perfil explicito/rol antiguo230 y su variante | 685 y681/D4: permiso efectivo correcto; invalidperfil no hereda roleadmin. Legacy sin perfil conservado, sin ampliar permisos. |
| Audio importado, captura vacia, cuenta y reintento229 | 685: codec/MediaRecorder reales del navegador con video y tono sinteticos; audio decodificado RMS>0.01, vacio no es exito, cuenta unica. No microfono/camara fisicos. |
| Selector publico231 y tema de buzon | 685: contraste PC/Pixel7 y6tests oficiales683 incluidos en22PASS; no sumar otra vez esos seis. No aceptar prototiposDOM678/679. |
| Mural: foto valida, pendiente privado, persistencia/recarga | 650 conserva647:2PASS PC/movil con AdminSDK/Storage demo, unID y caption pendiente no publico; no nuevas ejecuciones ni servicio Google real. |

El contraste Git de978/D4 devuelve el MISMO blob en estas nueve fuentes:
`src/app/(app)/invoices/[id]/page.tsx`,
`src/lib/entretenimiento/filtros-cara.ts`,
`src/lib/entretenimiento/marcos-dinamicos.ts`,
`src/app/evento/barra/[fiestaId]/listo/page.tsx`,
`src/app/ak-internal-experience-polish.css` y las cuatro paginas de
`src/app/evento/{fotocabina,touchpix,bogue,espejo-magico}/[fiestaId]/page.tsx`.
Esta comparacion es de fuentes concretas, no equivalencia transitiva de toda
la app. El extractor de busqueda facial SI cambio y no recibe certificacion
de deteccion por esta comparacion;685 limita su caso a entrada uniforme.

## Recuento sin sumar versiones

- 681/D4:869suites,5278PASS,0FAIL,0omitidas. Resultado ya ejecutado, no repetido.
- 680/D4:build/tipos/lint/acentos PASS. No recompilacion por este documento.
- 682/D4:22PASS de navegador, incluidos los6oficiales683.
- 650 conserva el libro640 historico:258claves,211PASS/11FAIL/36SKIP y
  dosMuro adicionales. NO se suma a5278 ni se cambia un rawFAIL aPASS.
- 14areas con auditoria documentada y421rutas/7perfiles son indices de
  cobertura historica; NO aceptacion de cada accion de esos perfiles.

## Instalacion desde cero: comprobacion nueva

690 ejecuta `npm ci --ignore-scripts --no-audit --no-fund` con HOME y cache
nuevos, sin credenciales heredadas. Exit0,2061paquetes,lock sin cambios.
Next15.5.27,React/ReactDOM19.2.8,TypeScript5.9.3,sharp0.35.5 y
@types/estree1.0.9 coinciden con el lock. No sustituir la version1.0.8 usada
por build680 en su recibo historico. No se actualizaron dependencias de app.

El alcance de690 es instalacion con scripts de ciclo de vida DESACTIVADOS;
no es un build limpio completo ni un npm-audit de seguridad.692 registra
por separado el chequeo adicional de tipos/nativeSharp y su resultado.

694 compara TODOS los paquetes presentes con el lock:2061/2061 coinciden,
0obligatorios ausentes y0versiones distintas.100entradas opcionales no
instaladas se conservan en el recibo, no se cuentan como instaladas.
Sharp nuevo encode/decode dePNG4x4 PASS tanto692 como693.

El TypeScript adicional NO queda aprobado:692 sin incremental/heap1536 y
693 incremental con cacheD4/heap2048 terminan exit134 por `JavaScript heap
out of memory`, antes de completar diagnosticos. Son limites de estos
probadores, NO errores de tipos demostrados ni ejecuciones PASS. Se conserva
raw/log de ambos; junction original restaurada yfuenteQA diff0. No se repite
otro intento ni se aumenta la memoria de la app. Build680 con tipos PASS
sigue siendo valido para sus dependencias originales, no para un build
limpio nuevo. La aceptacion adicional de tipos con depslimpias es INCONCLUSA.

No aparecieron nuevos defectos de aplicacion comprobados en esta pasada.
La auditoria total por cada control/rol NO se puede dar por certificada:
los recibos e indices indican expresamente el alcance que se ejecuto. Ni
5278tests ni421rutas sustituyen esa evidencia. Esta es una limitacion del
dictamen, no una nueva lista de funcionalidades para programar.

## Fuentes compartidas que no deben perderse

La rama de correcciones no contiene todos los artefactos de la rama historica.
La ausencia local de650 NO permite declararlo inexistente ni reabrir sus casos.
Recibos originales en commit e0ffd23951d87d6a93c63e1c77db4bfa473404d8:

- [597: cierres de filtros/barra/factura](https://github.com/akproduccioneseventos/app-AK/blob/e0ffd23951d87d6a93c63e1c77db4bfa473404d8/docs/evidencias/597-cierre-final-25octubre.md)
- [650: recorridos enumerados ejecutados](https://github.com/akproduccioneseventos/app-AK/blob/e0ffd23951d87d6a93c63e1c77db4bfa473404d8/docs/evidencias/650-cierre-recorridos-enumerados.md)
- [640: libro por caso/proyecto/SHA](https://github.com/akproduccioneseventos/app-AK/blob/e0ffd23951d87d6a93c63e1c77db4bfa473404d8/docs/evidencias/640-recuento-final.json)

Una primera lectura de ayudante declaro214/220/221 inconclusas por mirar
253/685 sin esos recibos; el director la DESCARTO tras localizar597/482,
leer los resultados681 y contrastar los blobs actuales. No son nuevos bugs,
no se emitieron nuevas ordenes ni se ejecutaron de nuevo sus pruebas.

No se reanuda la automatizacion eliminada por el dueno. Sin datos/cuentas,
cargos, mensajes o fotos humanas; no se afirma proveedor/modelo/voz/OAuth o
Hosting real comprobados. Esta entrega no programa nuevas funcionalidades.
