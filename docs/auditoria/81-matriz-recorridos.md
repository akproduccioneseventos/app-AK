# Matriz de cierre por recorridos - orden 81

Creada 2026-09-23 sobre main2f41322. NO representa nuevas pruebas ejecutadas.
Primero enlazar evidencia vigente existente; no repetir auditoria completa sin cambios.
Estados: pendiente de reconciliar / probado en SHA / fallo reproducido / bloqueado por entorno / requiere equipo.
Todas las filas inician PENDIENTE DE RECONCILIAR; algunos subcasos ya tienen evidencia en el historial.

| Bloque | Recorrido y resultado exigido | Responsable |
|---|---|---|
| Acceso | Correo, Google, recuperacion con cuenta de prueba, sesion vencida, rol restringido y carga de dashboard; no bucles silenciosos | Claude |
| Venta | Anuncio -> web -> simulador comun e IA por separado -> varios presupuestos mismo telefono -> CRM conserva historial/atribucion -> cita | Gemini; Claude importes |
| Presupuesto | Cambio paquete/menu/regalos, ofertas pertinentes, año futuro separado, precio/persona, pantalla=PDF, paginas legibles, compartir sin administrador | Gemini; Claude numeros |
| Dinero | Pendiente/rechazado no ingresa; seña/saldo/factura sin duplicar; pagos simultaneos; conciliacion; 19 manuales no se alteran | Claude |
| Organizacion | Configuracion -> tareas/responsable -> invitados/mesas -> comida/alergias -> personal/proveedores -> carga/retorno -> cierre, guardado y recarga | Gemini; Claude comida/datos |
| Cliente | Portal propio, documentos y aprobacion, progreso, salon3D; otra fiesta inaccesible | Gemini; Claude permisos |
| Invitado | RSVP aprobado por dueño, propio acceso, mural/moderacion, musica/participacion, trago y recuerdo; nada administrativo | Gemini; Claude permisos/stock |
| Entretenimiento | Configurar -> operador -> invitado -> captura/resultado -> entrega -> siguiente invitado; fotocabina/360/espejo/IA/totem | Gemini |
| Offline | Corte, reabrir, reconectar, dos pestañas, permiso revocado, cuota llena y entrega unica; no exito falso | Gemini; Claude integridad |
| Integraciones | Entrada/salida real en sandbox, deduplicacion, fallo/expiracion/revocacion y recuperacion; cada proveedor declarado | Gemini; Claude credenciales/cobros |
| Visual | Desktop/movil/totem, teclado, texto, imagen real correcta, movimiento reducido, carga/error/vacio, contraste, CTA visible | Gemini |
| Rendimiento | Medicion comparable antes/despues de carga e interaccion; no logs/secretos; no afirmar metricas no medidas | Gemini |
| Cobertura | Relacionar cada ruta/tarjeta/accion del inventario con recorrido o exclusion justificada; no contar archivos como pruebas | Codex revisa evidencia |
| Equipos | Ensayo con camara/360/pantallas/barra y red del lugar; dispositivo/fecha/responsable y resultado | Operador + Claude/Gemini |
| Lanzamiento | SHA congelado, pruebas/types/acentos/build/E2E y smoke del despliegue del mismo SHA; no fusion automatica | Claude compila; Codex revisa; dueño fusiona |

Formato por caso: ID; ruta; rol; SHA; entorno; fixture; pasos; esperado; observado; estado; evidencia; fecha; responsable; limites.
No datos reales/contactos/tokens en capturas. PR1214 conserva su devolucion de seis E2E; orden80 conserva residuales. Reutilizar ambas, no abrir tareas duplicadas.
