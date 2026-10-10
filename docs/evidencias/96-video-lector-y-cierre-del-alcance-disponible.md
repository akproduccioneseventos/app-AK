# Auditoria96 - Lector Video de Vida y evidencia disponible

Area:entretenimiento/portal cliente. Producto9a054620718673f00e10b52f0811cc1af729ba4e.
Hallazgo nuevo:VID96-LECTOR P2, error de lectura mostrado como cero fotos.
NO CONTRASTADO CON TANDA LOCAL NO SUBIDA. Main remoto mismoSHA;
unica PR abierta1286 QA/documentacion. No correcciones de app.

## Comportamiento comprobado

96-video-lector.test.tsx usa paginaReact y acciones REALES; controla solo
SDKexternos, navegacion y envoltorios de presentacion. No stub del lector
ni copia de su logica. React18.3.1 existente, sin instalaciones nuevas.
Jest4casos2pass/2fail2.681s, raw96-lector.json/log:

| Criterio | Observado |
| --- | --- |
| Una foto publica/listado sano | 1de2/Foto1: PASA |
| Subida de reemplazo rechazada | Preview/contador previos conservados, error visible: PASA |
| Listado SDK rechazado | 0de2/dos cargas habilitadas/sin error: FALLA |
| Dos fotos, una publica y otra firma rechazada | Descartadas ambas/[]: FALLA |

Una causa/orden148, no dos bugs. Sospecha de preview borrado DESCARTADA:
el consumidor ignora null. No volver a encargar reemplazo92.

Navegador real anonimo/Next dev9a/emuladores demo, SIN firmante Google:
4ejecuciones2pass/2fail. Raw96-browser.json/resumen96-resultados.json.

| Contexto | Galeria genuinamente vacia | Foto guardada/lector sin firma |
| --- | --- | --- |
| PC | PASA48.164s | FALLA31.297s |
| Movil | PASA8.200s | FALLA6.104s |

Storage conserva01.png, HTTPdemo200/bytes exactos antes de abrir; despues
sigue el objeto pero pantalla0de2/dos cargas/sin aviso. Captura03-1.png
inspeccionada visualmente. Fallo por aviso ausente, NO timeout ni ausencia
del archivo. Datos/capturas96-artifactos/01-* y03-* preservados.

Limite: no demuestra fallo de firma en cuenta real, ni valida URLpublicada
en staging. SDKcontrolado confirma causa; navegador confirma consumidor.
No cambiar ACL ni exponer credenciales para sortear emulador. Esa aceptacion
visual real sigue pendiente. No afirmar que todas las fotos reales fallan.

## Arnes, no producto

Inicial0tests:testing-library/react ausente;96-lector-inicial.json/log.
Se uso ReactDOM instalado. Previo actdeprecated genera warning propio;
96-lector-previo.json/log. Final React.act mantiene2pass/2fail sin warning.
Tiempo incluye compilacion fria Next27.5s y /_error24.4s, NO rendimiento
productivo. Aborted/ECONNRESET conservados96-start.log; positivos pasan y
negativo movil se reproduce sin timeout. No nuevo defecto por esos logs.

## 19 originales y cierre acotado

Agente economico inventario SOLOscripts/docs/datoslocales, luego cerrado:
sin export autoritativo/documentos19manuales. 82-base-real.json:dos lecturas
gRPC7/recordsRead0 son LIMITE, no ausencia. Referencia29migrados/QA PDFsJSON
no identifica19originales. No base real consultada ni dinero conciliado.
Hace falta export de sololectura autorizado+originales; Claude lleva numeros.

Finally borro fixtures propios.96-limpieza.json:sin colecciones restantes,
sin datos ajenos eliminados.96-runtime-detencion.json:arbol PID/fecha/comando
propio detenido,3300/8085/9195 sin listeners. No procesos globales matados.

Codex completo este bloque disponible, reutilizo94-95 sin repetir143Jest/
20positivas y documento148. No app/buildfinal/merge/cobros/envios/proveedor
pago. Mantener144-147/3D/limites95+148. NO14areaslimpias ni0errores; faltan
correcciones/retests y evidencia real especificada95, no certificado total.
