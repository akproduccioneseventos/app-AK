# Cierre integral AK: cobertura y evidencia, no certificado

Corte25/09/2026. Main512eca79b57090beb8423a8ca9fbf17d756ac635.
PR1225 abierta: c4019c233777409f0bdc5ec00203a0136a1d53f7. No fusionar por esta revision.
Codex audita; Gemini programa interfaz; Claude integridad/dinero/comida/permisos y compila.
No existe garantia absoluta de cero errores. Tampoco se declara que este inventario sea una auditoria funcional completa.

## Superficie completa inventariada
360 page.tsx,43 route.ts,155 modulos de acciones,87 archivos de codigo E2E (incluye helpers, NO87 pruebas).
875 declaraciones de funciones exportadas de acciones;5559 declaraciones JSX de controles/eventos en src. Son definiciones, no botones unicos renderizados.
JSON de superficies: docs/evidencias/COBERTURA-INVENTARIO-2026-09-25.json.
JSON de controles/funciones: docs/evidencias/CONTROLES-ACCIONES-512eca7.json.
Los segundos no capturan reexports/exports variables ni controles dinamicos: conciliarlos con navegador. Tarjetas informativas y canvas se revisan visualmente.
POR_RECONCILIAR significa que falta enlazar evidencia vigente, NO que no se haya trabajado antes ni que todo este roto.

## Nueva tanda: evitar duplicar arreglos
Revalidacion AST acotada de main512eca7:7 PASS.
- INC01: dos instancias conservan comentario y resolucion usando mutacion individual.
- PF02: dos instancias conservan ambas encuestas usando altas individuales.
- LOG01: stock6/10 normal,11/10 conflicto,6+6/10 conflicto.
- BAR01: reintento transaccional confirmado devuelve stock y elimina pendiente; aborto antes de confirmar conserva stock y pendiente.
Dependencias de persistencia se simularon con contrato atomico; NO se ejecuto Firestore/emulador/build. No aprobar todo flujo de pago por esto.
Evidencia: cierres-512eca7.cjs y resultados.

PR1225: LOG04 tiene funcion pura nueva y consumidor actualizado; sonda historica de4 casos pasa contra esa funcion (incluye respuestas invertidas). Los helpers de item se tomaron de main, sin cambios en esos archivos. No E2E ni build de PR ejecutado por Codex.
Importacion movil: PR1225 quita skip y modifica pantalla. Correccion presente PENDIENTE de comprobar en navegador, no cerrada por borrar skip.
VID03 ZIP parcial/vacio: la PR1225 no toca la ruta y sigue como fallo verificado en version anterior, codigo de ruta sin cambios. No volver a certificar descarga hasta reprobarla.

## Matriz unica, sin nuevas ordenes duplicadas
Se continua orden81; orden85 cubre LOG04, devolucion76b cubre importacion movil, orden86 es nueva evolucion del dueno y no sustituye correcciones.
Para cada pagina/endpoint/accion/control:
- ruta y rol autorizado, tarea que permite terminar y datos/efectos que modifica;
- caso de prueba ligado, SHA de codigo y entorno/configuracion de ejecucion;
- esperado/observado y evidencia (captura, log, archivo descargado, estado persistido);
- PASS acotado / FAIL reproducido / correccion presente sin validar / bloqueado por entorno / no aplica con motivo.
No atribuir a todos los consumidores una prueba de funcion aislada.
Reusar pruebas vigentes solo si no cambiaron simbolos, consumidores, datos/configuracion o dependencias relevantes.
No poner verde por archivo existente, import, cantidad de tests, compilacion o cuenta de visitas.

## Bloques de aceptacion
| Bloque | Prueba que debe quedar respaldada |
|---|---|
| Acceso y permisos | Correo/Google/recuperacion/sesion vencida; roles y acceso cruzado; datos del panel tras entrar |
| Web y venta | Navegacion real desktop/movil, CTA, imagen-menu correcto, blog/galeria/salon sin mezclas |
| Simuladores | Comun e IA independientes, varios presupuestos por telefono, cambios paquete/regalos, total actual y proyeccion aparte |
| PDF/compartir | Importes iguales a pantalla, paginacion/zoom legibles, enlace propio, sin controles administrativos |
| CRM/agenda | Origen comercial conservado, citas en ficha, no sobrescritura ni duplicado en reintento |
| Contabilidad | Totales independientes con fixtures, estados de pago, saldo/presupuesto/factura, concurrencia y fallos parciales |
| Planificacion | Todas las pestañas, guardado/recarga, tareas/personas/fechas, invitados/mesas/comida/personal/compras/logistica |
| Cliente/invitado | Propio evento, aprobaciones, documentos, RSVP aprobado por dueño, contenido moderado y datos privados aislados |
| Entretenimiento | Configurar -> operar -> captura -> entrega -> siguiente persona; errores/reintentos/reconexion sin perder identidad |
| Mural/totem/barra | Dos dispositivos, cola y moderacion, sincronizacion, pedido/stock/compensacion y entrega confirmada |
| Empresa | Catalogos/precios/empleados/proveedores/activos, archivo subido, bajas y referencias cruzadas |
| Post-fiesta | Encuesta, regalos, devoluciones, archivos y entrega final, sin falsos exitos |
| Integraciones | Cada conexion real y sus permisos, expiracion, revocacion, duplicados y fallos; sandbox, no contactos reales |
| Accesibilidad/visual | Desktop/movil/totem, teclado/foco/contraste/textos, vacio/error/carga, movimiento reducido y canvas no vacio |
| Rendimiento | Medidas repetibles de carga e interaccion, sin ralentizar equipos reales ni inventar metricas de usuarios |
| Operacion | Respaldo/restauracion en entorno aislado, perdida de red, reinicio, despliegue y registros sin secretos |

## Puerta de salida y faltantes reales
1. Resolver VID03 y validar correcciones de PR1225 sobre su conjunto congelado, sin otra PR por cada defecto.
2. Reconciliar inventario con pruebas de uso vigentes. No hay evidencia inspeccionada que cubra actualmente las645 entradas y los5559 controles.
3. Claude adjunta comandos/resultados del conjunto y SHA; no basta duracion de corrida ni texto "todo verde". En la copia no se hallaron node_modules/build o reportes ejecutables de la ultima tanda para repetir recorridos internos aqui.
4. E2E por roles con fixtures aisladas; ninguna prueba debe cobrar, publicar, mandar mensajes a clientes o borrar datos reales.
5. Ensayo fisico de dispositivos y conexiones reales. No se certifica camara/360/barra desde AST. Ante fallo repetido NO concluir automaticamente "es el equipo, no la app": revisar permiso/navegador/configuracion/codigo/equipo.
6. Verificar SHA desplegado y recorridos criticos despues del despliegue. Dueño aprueba fusion.

## Metodo y costo
Un agente economico hizo inventario de archivos; principal completo AST de controles y reviso fallos/cierres sensibles. Agente cerrado.
Graphify ausente en copia aislada; se reutilizo historial y rutas verificadas. Sin herramientas nuevas de produccion.
Esta entrega NO afirma que toda la app fue probada ni finalizada. Hace visibles pendientes y corrige el estado de errores que ya recibieron arreglo.
