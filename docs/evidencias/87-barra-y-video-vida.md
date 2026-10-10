# Auditoria 87 - Barra hasta entrega y video de vida

9/10/2026. Fuente ejecutada main
`1b61295ab977fd6f204ffdab0f190edbd0f0ed6b`; branch documental131dbd30,
PR1277 abierta. Main remoto sigue igual al contrastar. Entregas locales de otras
IA no subidas NO CONTRASTADAS. No reauditar135/136 mientras se programan.
Resultado PARCIAL: tres defectos nuevos y una friccion; no app sin errores.

## Entorno

Build86 reutilizado, mismo SHA guardado; NO otra compilacion. TEMP propio
ak-entorno-aislado-PHvcfo, Next3300, proyecto demo-ak-producciones, Firestore8085
y Storage9195. Sin .env real ni credenciales/proveedores reales. Launcher87
separa sus logs de86; semilla ficticia aprobo. App conserva fallback JSON y
usa escritura real contra SDK/emuladores; no certificado de Firestore produccion.
Un ayudante economico preparo la sonda de barra; el principal reviso/adapto
guardas, receta, identificadores y consumidores ANTES de ejecutarla. Ninguna
conclusion se acredita solo por el ayudante. Agente y procesos propios cerrados.

## Aprobado - Cuatro E2E, Dos Recorridos En PC Y Movil

| Recorrido | Resultado observable |
|---|---|
| Pedido->entrega | Invitado con token propio y sin cookie de equipo pide desde MiniQuiosco. Un pedido real en bar_drink_orders, nombre/guestId correctos; insumo1000->975. Contexto distinto de equipo en barman pulsa Preparar/Listo/Entregado. SDK observa cada estado. Reload muestra historial Entregado; stock sigue975, no otro descuento. Otro pedido de otra fiesta no aparece ni cambia. |
| Retest BAR82-CANCEL | Se corta SOLO POST Cancelar con ID propio. Aviso visible, boton recuperado, persistencia sigue nuevo y no dice cancelado. Reintento pasa, SDK conserva cancelado; recarga no muestra Mi pedido actual. Adaptacion de prueba existente al lector emulado, no nueva implementacion del arreglo. |

Raw: `87-barra-entrega-resultados.json`, `87-barra-corte-resultados.json` y
`87-barra-mobile-resultados.json`; sonda `87-barra-entrega-real.spec.ts`.
Capturas/final persistido en artifacts/attachments. La entrega del trago fisico
NO fue probada: se comprueba el registro entregado por el barman. Tampoco se
probo cancelacion del barman, falta de stock, cierre/informe o todos los perfiles.
Solo queda aceptado el deltaBAR82 y este resultado final; no toda area limpia.

## Defectos Confirmados

- **VID87-REEMPLAZO (P2, Gemini):** cliente sube PNG1 y reemplaza con JPG1.
  Ambas subidas UI dicen Foto Subida; galeria dice1de2; SDK confirma dos objetos
  01.png/01.jpg con bytes/MIME iguales a las dos imagenes originales. La
  asercion UNA vigente falla. Lista y ZIP consumen ambos en fuente; contenido
  final ZIP y foto al recargar NO verificados. Orden137.
- **VID87-CIERRE (P1, Claude):** pantalla publica abierta; fixture propio se
  deshabilita en JSON/Firestore, lecturaSDK confirma false. Sin sesion equipo,
  esa pantalla guarda01.png en Storage. Se esperaba0, queda1; no confiar solo
  en la comprobacion de la pagina nueva. Orden137.
- **BAR87-VISIBLE (P2, Gemini):** captura real movil del pedido NUEVO muestra
  boton vacio al lado de Preparar. XCircle/text-white sobre tarjeta blanca;
  tampoco nombre accesible/tooltip en ese estado, verificado en consumidor.
  No se acciono ese boton; no atribuirle otra falla funcional. Orden138.
- **BAR87-ESPACIO (P2, FRICCION, Gemini):** misma captura tiene tres columnas
  apiladas con min-h58vh y grandes zonas vacias: mucho desplazamiento para
  estados sin pedidos. Propuesta responsiva conservando todos los estados
  visibles y su comportamiento, no imponer tabs/ocultar. Orden138.

Fuentes/consumidores exactos en137/138. Nombres de archivo y actor verificados,
no copiar rutas del historico. Dos casos negativos de video ejecutados, separados
del resultado de barra. Nueva subida no requiere login del equipo por decision
del dueno: exigir estado actual NO cambia esa decision.

## Falsos Positivos De Mi Sonda Descartados

- Primer video abria /evento/video-vida/id, que es del equipo y pide sesion;
  link compartido por editor es /video-vida/id. Selector de galeria no encontrado
  no prueba fallo de login. Raw `87-video-vida-primer-intento.json` separado.
- Primer cierre espero response.finished del streamNext y agoto60s. Probe
  corregido espera escrituraSDK o rechazo visible. Segundo intento falla en
  asercion concreta por objeto guardado5.9s, no por timeout. Raw de ambos.
- No reabrir VID03/orden69 (tope50, borrado fallido y ZIP incompleto avisado).
  Busqueda focalizada de registro/ordenes no encontro estos tres consumidores
  reportados antes. No convertir el patron general conocido en otra auditoria.

## Entrega Y Limites

Codigo producto no modificado, no paquetes ni configuracion de produccion.
Todo87 es QA/registro/ordenes. Pruebas propuestas en comprobar siguen PENDIENTES;
las dos negativas deben pasar tras arreglo, no declararlas solucionadas hoy.
JSON, sondas, PNG/contextos/logs a GitHub. ZIP traces y videoWebM de fallos quedan
SOLO locales; referencias enraw no garantizan descarga remota.
El audio realIA,19originales, proveedores autorizados, hardware y otros huecos
siguen en matriz84. No cuentas reales, archivos de clientes, cobros/publicaciones,
cron, incremento de memoria, GitHub billing ni merge. No areas completas limpias.
