# 212 - Inventario declarativo de cobertura E2E

- Fuente: manifest `docs/evidencias/209-ejecucion.json`, SHA `fa3b492b8f1d6a77433a92f4d63b665cfea3747c`.
- Estado reportado: `running`. La presencia de tests no demuestra ejecución ni aprobación.
- Conteos observados en log/contexto: 145 copias y 1172 casos. No son recuentos independientes fiables de este inventario.
- Método: títulos y assertions de los specs originales `tests/e2e/*.spec.ts` incluidos en el manifest; referencias archivo:test. Agrupar por 14 áreas para orientar integración, no certificar cada botón.

## Áreas

1. Público, marketing y contenido compartible: `45-recorridos-pendientes.spec.ts` (landing/simulador), `46-estetica-movimiento-visible.spec.ts` (portada), `47-redes-confirmaciones-y-videos.spec.ts`, `tarjetas-whatsapp.spec.ts`, `trabajos-completos.spec.ts`.
2. Simulador y presupuestos: `45-recorridos-pendientes.spec.ts`, `46-estetica-movimiento-visible.spec.ts`, `130-compartir-presupuesto-publico.spec.ts`, `simulator-budget-journey.spec.ts`, `simulador-contacto-oficial.spec.ts`, `trabajos-completos.spec.ts`.
3. Portal y persistencia de clientes: `45-recorridos-pendientes.spec.ts`, `130-compartir-presupuesto-publico.spec.ts`, `139-cliente-persistencia.spec.ts`, `137-maestros.spec.ts`, `133-invitado-con-red-local.spec.ts`, `viaje-invitado.spec.ts`.
4. Invitados, RSVP, QR y acceso: `133-invitado-con-red-local.spec.ts`, `133-qr-descarga-lector-local.spec.ts`, `viaje-invitado.spec.ts`, `45-recorridos-pendientes.spec.ts`.
5. Operación de evento y estaciones: `45-recorridos-pendientes.spec.ts`, `46-estetica-movimiento-visible.spec.ts`, `como-se-ven-las-estaciones.spec.ts`, `50-tecnologia-app-fiesta-demo.spec.ts`.
6. Fotocabina, cámara y recuerdos: `48-fotocabina-recuerdo-seguro.spec.ts`, `48-touchpix-entrega-sin-reinicio.spec.ts`, `81-captura-reconexion-entrega.spec.ts`, `81-prueba-previa-no-finge-equipo.spec.ts`, `touchpix-camara-y-recuerdo-con-imagen.spec.ts`, `el-album-del-recuerdo.spec.ts`, `el-album-se-arma-solo.spec.ts`, `el-album-se-baja-entero.spec.ts`.
7. Redes, conexión y resiliencia: `47-redes-confirmaciones-y-videos.spec.ts`, `81-cola-aislamiento-y-reintento.spec.ts`, `conexiones-redes-error-y-reintento.spec.ts`, `senal-mala.spec.ts`, `133-invitado-con-red-local.spec.ts`.
8. Comercial, prospectos y agenda: `136-maestros.spec.ts`, `45-recorridos-pendientes.spec.ts`, `50-venta-origen-y-galeria-publica.spec.ts`.
9. Maestros y administración de empresa: `136-maestros.spec.ts`, `137-maestros.spec.ts`.
10. Facturación, contabilidad y permisos: `130-factura-sin-superposicion.spec.ts`, `49-contabilidad-cobros-conciliados.spec.ts`, `49-contabilidad-permisos-y-errores.spec.ts`.
11. Cocina y catering: `143-cocina-fecha-local.spec.ts`, `catering-maestro-simulador-fotos.spec.ts`.
12. Multimedia, galería y video: `el-album-suena-o-no-muestra-el-boton.spec.ts`, `video-vida-error-lectura.spec.ts`, `47-redes-confirmaciones-y-videos.spec.ts`.
13. Voz en vivo y asistente: `voz-en-vivo-reintento-y-cancelacion.spec.ts`, `89-ia-no-frena-la-fila.spec.ts`, `sofia-composer.spec.ts`.
14. Interfaz adaptable, navegación y calendarios: `130-factura-sin-superposicion.spec.ts`, `anda-en-el-celular.spec.ts`, `calendarios-react19.spec.ts`, `carga-rapido.spec.ts`, `89-la-barra-no-ofrece-lo-agotado.spec.ts`, `90-lo-que-va-atras-dice-donde-quedo.spec.ts`.

## Roles y límites

Roles explícitos en títulos/escenarios: prospecto, cliente, invitado, equipo, operador, comercial y empresa. Roles inferidos por el contexto de los escenarios: visitante público, destinatario cliente, equipo/operador, administrador, contabilidad, usuario con permisos, cocina/catering y usuario de interfaz. No interpretar esto como matriz de autorización.

Servicios externos reales no están declarados: manifest `realServices=false`. Cuentas/servicios productivos y hardware físico quedan fuera o simulados; las pruebas locales o de cámara simulada no certifican equipos reales. La lista refleja intención declarada por specs y asserts seleccionados, no exhaustividad de la app. No se atribuyen bugs ni órdenes por ausencias estáticas.
