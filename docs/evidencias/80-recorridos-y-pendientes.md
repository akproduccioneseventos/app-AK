# Auditoria 80 - evidencia recuperada, no repetir correcciones

Area: plata, cliente, fiesta/CRM y asistente.
Recorrido: 8/10/2026, commit `09c8d814fdecdca00da71de7bc22c1d64ef0e662`,
BUILD_ID `y3pk-oG28Gx7I91pIPgS2`. Entorno aislado en puerto 3300, datos ficticios.
Contraste de codigo: 9/10, main `497ee725cb4d8cce6d1c97422fd674cbbe86c051`.
No habia PR abiertas al contrastar. No equivale a repetir el navegador sobre ese SHA.

## Hallazgos pendientes

- SHARE80 P1: copiar, WhatsApp y compartir nativo de la barra entregan URL privada.
  `80-resultados/04-enlace-copiado.txt` registra ausencia de token. El enlace publico
  seguro de la pagina funciona sin sesion. Ver orden 130, consumidor y emisor exactos.
- HIT80 P2: el asistente tapa el centro de Nueva Factura en 1280x720. Clic abre chat;
  teclado abre factura. `18-factura-boton-cubierto.json` y PNG. Posicion causal vigente.
- WA80 P2: cliente con telefono local produce `wa.me/099000080` sin prefijo de pais.
  `24-cliente-enlace-whatsapp.txt`. No se enviaron mensajes ni se cambio su telefono.

## Ya atendido en main

CLIENTEPAGO80: el cliente veia Informar Pago y el servidor rechazaba ese permiso.
Ahora solo lo arma para equipo; guardar pago sigue protegido. CITA80: la reunion del
simulador ahora busca el prospecto por presupuesto del lado servidor. No rehacer estos
dos arreglos ni aceptar un prospecto arbitrario del navegador. Confirmacion de navegador
actual pendiente, no confundir presencia de arreglo con retest ejecutado.

## Resultados observados, solo en el SHA del recorrido

- Dos propuestas para el mismo telefono permanecen en CRM, lista interna y recuperacion
  publica; no imponer una sola propuesta por prospecto. Archivos 08-16.
- Cambios basico/intermedio/basico conservan servicios sin duplicar regalos cobrados.
  El contador se vio al final. No reabrir decisiones de funcionamiento aprobadas.
- PDF 17: dos paginas A4 numeradas, formato formal; total 104125 para 80 personas,
  1302 por persona segun redondeo comercial. Archivos PDF y dos PNG de render.
- Presupuesto: exceso de 10000 rechazado, pago parcial de 5000 persistio tras recargar;
  pendiente no figura como ingreso confirmado, confirmado 6501, rechazado excluido.
  Total aceptado 2027 241901, saldo 235400. Archivos 01-07.
- Factura independiente de 1000 UYU: 1002 rechazado; pago 250 genera recibo y saldo 750.
  Ultimo pago 750 mostro 1000 pagado y saldo cero, PERO el archivo 23 tras recargar solo
  muestra carga (39 caracteres): persistencia de ese ultimo pago NO comprobada.

## Inventario

Raw: `docs/evidencias/80-resultados/`, archivos 01 a 24. Fotografias de pantallas, DOM,
JSON de hit-test y PDF son de datos ficticios. No son registros de los 19 presupuestos
reales. No se validaron cobros reales, conectores reales, impresora ni equipamiento.

## Cobertura

No certifica app completa, cero errores ni estas areas limpias. Solo reutiliza resultados
con SHA explicito y entrega los tres problemas restantes, sin repetir los dos ya arreglados.
