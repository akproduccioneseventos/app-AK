# 139 - Limites externos y lo realmente comprobado

Fecha16/10/2026, fuente7230f9d02b32805952a185f704a0208bd5d643e6.
El pedido es cerrar lo pendiente, no inventar un certificado ni cambiar el
reparto: Codex audita, Gemini programa, Claude valida/compila/fusiona.

## Sitio publicado

GET publico a `/api/health`, sin cuenta ni escritura, observado16:50:56UTC:
HTTP200, `status:ok`, misma fuente7230, compilacion publicada01:13:49UTC.
Ver139-public-status.json (respuesta acotada, sin tokens).

- Firebase informa true y el endpoint respondio. No es prueba de cada flujo.
- Gemini, GoogleWorkspace y mail informan true: el codigo de health comprueba
  presencia de configuracion. NO autentica ni llama a esos proveedores.
- Instagram y MercadoPago informan false. No se simulo exito ni se llamaron
  sus API, no se inicio un cobro ni se publico contenido.
- Voz/modelo externo no se ejecutaron: los dobles locales previos no prueban
  comprension, calidad de voz, costo o acciones autonomas con modelo real.

Que falta para esos servicios: una sesion de prueba autorizada de la cuenta
correspondiente, permisos vigentes y un resultado observado (por ejemplo,
una importacion del contenido de prueba, un correo recibido o webhook de
pago SANDBOX). Una URL de perfil o variable presente no reemplaza ese resultado.
NO se necesitan cargos reales para ensayar MercadoPago en sandbox, pero SI
credenciales/sandbox validos y un caso de prueba disponible; no se inventaron.
No pedir secretos por este documento ni copiar claves en registros de IA.

## Originales y equipos

-19presupuestos manuales: el dueno esta buscando la carpeta. Para conciliar
  importes/servicios/fechas hay que comparar esos documentos originales con la
  carga correspondiente. Los29migrados o fixtures no sustituyen los originales.
-Fotocabina/espejo/camara/360/barra: navegador y emulador pueden probar botones,
  permisos y colas con datos ficticios. No prueban capturas del dispositivo,
  giro/control fisico, impresora, iluminacion, pantalla ni entrega al operador
  con su equipo real. Ese ensayo sigue pendiente y no se marco como aprobado.

## Arreglos de codigo

Orden180/Claude ya emitida; el fallo de perfiles sigue reproducido en7230.
PR1325HEAD5f704e68 y1326a21d0b69 no incluyen cambios a perfiles.ts/auth.ts.
NO CONTRASTADO CON LA TANDA PRIVADA: HEAD privado desconocido. Codex no
reimplementa ni vuelve a emitir la orden; retest focal cuando llegue el arreglo.

No equivale a certificar toda app:134 es inventario y las aceptaciones135-139
solo valen por los roles, datos y recorridos realmente ejecutados.
