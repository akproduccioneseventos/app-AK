#145 - Recuento acumulado: auditado, corregido y pendiente

Actualizacion18/10: ver146-147-cierre y148-cierre-proveedor.1328 incorpora
correcciones171/172/184 ademas179/180;14634controles ligerosPASS, noUI.
147detecta185; PR1333 la corrige y148aprueba4regresiones del helper, no accion
completa ni despliegue. El resto de este recuento conserva su fecha original.

Registro al16/10/2026. Recopilacion, NO otra ejecucion de pruebas.
Fuentes: conciliacion134 de2026documentos historicos, recibos128-144 y
YA-RESUELTO. No se suman reintentos como funciones ni se descartan pruebas
viejas solo por faltar un enlace automatico. Cada recibo conserva su SHA.

Main observado:7230f9d02b32805952a185f704a0208bd5d643e6.
Fuente nativa reciente:7230/build135 y17d26a631/build142. PR1327a98a4b250
solo cambia cuatro tests respecto17d, no su runtime/config/dependencias.

## Alcance por las14areas

| Area | Evidencia acumulada que SI existe | Lo que NO permite dar por cerrado |
|---|---|---|
| Cobros/cuotas/facturas/recibos | Auditorias y regresiones de cobros, centavos, reintentos, costos y reportes; recibos124/128/130/133 | No aceptacion actual de cada boton/moneda/rol ni MercadoPago real |
| Contrato/sena/firma | Contrato y constancia ficticia; revision127/133/135/142 |171 titulo movil sigue3lineas en ultimo ensayo; caso completo timedOut; no firma legal/servicio externo certificado |
| Comida/compras/insumos | Costos159/160 y pruebas de compras;142 porciones100/80/20/100 y Celiaco5;178 cabecera imprime PC/movil |184 fecha civil aparece dia anterior enUruguay; no todos los menus/stock/compras por rol |
| Ingreso/sesiones/permisos |13650HTTP autorizacion con7perfiles/cookie alterada/vencida;138 claves heredadas |180 arreglo presente en1328, retest pendiente; no todos los endpoints ni OAuth real |
| Fiesta/planificacion/invitados | RSVP, conflictos/personal, maestros;1353D cliente PC/movil con canvas real y giro | No cada tarjeta/editor/estado; el3D no queda aceptado entero por dos viajes |
| Portal cliente |132/133 material/musica/mensajes/contrato/decoracion con alcances separados | No todos los permisos/estados;171 parcial; no declararlo nunca revisado |
| Invitado/invitacion |133RSVP10PASS yQR descargado/lector4PASS historicos recuperados134 | No camara fisica/offline completo ni todas las rutas actuales |
| Web/blog/simuladores |133viaje comercial/CRM/FacebookUTM/WhatsApp PC, revisiones publicas;118/119/121reintentos segun recibos | No todas las imagenes/paquetes actuales; viaje comercial movil omitido, noPASS;144 no mide velocidad |
| Instagram/YouTube/galeria | Revisiones de sincronizacion/idempotencia y contenido; indice134 | No sincronizacion real de cuentas ni catalogo completo certificado |
| Entretenimiento/estaciones |125/133totem, puerta, QR, controles de errores yPWA con limites | No cada equipo ni fotocabina/camara/360/espejo fisicos; simulado no equivale a hardware |
| Barra de tragos |132pedidos/listos/pantalla y regresiones relacionadas | No ensayo con barra/equipos reales ni todos los estados/operadores |
| Asistente/WhatsApp |120/121herramientas/resultados/errores yACK, dobles locales del protocolo; recibos posteriores conservados | No Gemini/voz/envioWhatsApp reales ni autonomia completa demostrada |
| Personal/llegada/recibos |129/133llegada/reintentos y136alta empleado SDK; conflictos revisados previamente | GPS y servicios reales no probados; no todos los recibos/roles actuales |
| Automaticos/avisos |129fallos parciales y regresiones; historico de tareas/duplicados | No ejecucion de cada tarea con su proveedor real |

Las421rutas/6401ubicacionesAST son inventario, NO421rutas ni6401controles
aprobados funcionalmente. No existe evidencia que permita afirmar todas las
combinaciones de rol/estado/dispositivo. No dar porcentaje global inventado.

## Estado de los hallazgos recientes, sin confundir versiones

| Hallazgo | Estado observado |
|---|---|
|137/139cliente SDK inconcluso | CERRADO ese viaje por141:2PASS PC/Pixel7, sinemail y documento/ID/campos persistentes tras recarga |
|178cabecera hoja de cocina oculta | CORREGIDA y PROBADA en142 sobre17d:2PASS, dosPDF1pagina renderizados; no Hosting certificado |
|171contrato movil | PARCIAL en ultimo ensayo142: sello/boton mejoran, titulo3lineas; no casoPASS |
|172dock social tapa Evento | REPRODUCIDO en142:2247.17px2 de interseccion, sin desborde horizontal |
|179WA099sin598 y titulo costos | CORRECCION PRESENTE enPR1328 ade94f83b8820ed43eff23227aaecb77776a042b; usa toWhatsAppDigits ytext-white. NO retest Codex de esa fuente |
|180validador acepta claves heredadas | CORRECCION PRESENTE enmisma1328: hasOwnProperty.call. NO regresion ejecutada por Codex eneseSHA |
|184fecha cocina un dia antes | REPRODUCIDO143-civil:1PASSUTC/1FAILUruguay con fecha fija2027-08-08, pantalla/print; orden paraClaude |
|144cambios de tres pruebas nuevas | Lectura de diff sin aserciones borradas/skips nuevos; plazos120/180seg NO certifican rendimiento |

PR1328 se inspecciono con API paginada, no solo sus primeros30archivos.
Correccion presente NO significa probada, integrada ni desplegada.
PR1329 b8491bda3f25aadc71f36f42d5878a47261bb1bf y1330
c7f9e3e6f960add2f970676819ec87b65b1af7c8 son NUEVAS: solo metadatos
consultados en este recuento. No se afirma que sus cambios sigan fallando ni
que ya corrijan171/172/184. Contrastar su delta antes de encargar/retestear.
PrivadoactualClaude NO CONTRASTADO. No reemitir ordenes por prefijos179/180.

## Que falta realmente

1. Revalidar179/180 en1328 y contrastar1329/1330 antes de repetir pruebas.
2. Cerrar171/172/184 SOLO al comprobar un SHA con su correccion.
3. Completar evidencia funcional de controles/roles/estados que el inventario
   no cubre: la tabla identifica limites, no una lista exhaustiva de bugs.
4. Contrastar19presupuestos contra originales (dueno buscando), integraciones
   con cuentas autorizadas, modelo/voz y ensayo fisico. No sustituir por mocks.

Conclusion: NO esta comprobado que todo lo indicado se haya arreglado. Parte
esta probada, parte tiene codigo nuevo pendiente de validar y parte sigue
sin evidencia suficiente. No se declara toda app auditada ni ceroerrores.
