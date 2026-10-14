## Descripcion del Cambio

Mantiene los deltas116-122 de esta propuesta y agrega123 sobre main096,
sin reemplazar los cambios de juegos/votos/misiones que ya publico Claude.
**Claude fusiona; Codex no fusiono esta PR. Privado Claude NO CONTRASTADO.**

Fuente app comprobada:34f45fbb1a75b7ddc92edadc7831d55f098a9cdb.

- IA: precios por persona, tramos y personal usan el motor financiero; incluyen
  metadatos y edades para que el importe no cambie al guardarse. No guarda
  servicios desconocidos/ambiguos a medias ni cobra dos veces el mismo servicio.
  Distingue precio cero, campo legacy cero con respaldo y ausencia de precio.
- Chat: conserva A incierto mientras B se confirma; retry/recarga recuperaA.
  Cotizaciones deliberadas identicas siguen permitidas. No deduplica por telefono.
- Tarjeta del asistente: evita controles; Guardar libre3/3PC y3/3Pixel7,
  teclado/arrastre/minimizado preservados. No promete evitar todo texto.
- Dependencias:19familias parcheadas conservando sus lineas mayores;56GHSA
  unicos retirados(86->30). Lo restante esta desglosado, no escondido ni seguro
  por pasar build. Orden163 para la revision estructural que queda.
- Recuento:421rutas reconciliadas,6con escenarios actuales,315referencias de
  suites ejecutadas,5historicas,24solo referencias,71sin prueba vinculada.
 95seguimientos de evidencia NO son95errores ni95rutas nunca auditadas.
- Registro compartido YA/ESTADO/AGENTS actualizado; grafo local14850/44190/935,
  sinLLM. Se conserva el historial para no volver a encargar arreglos hechos.

## Tipo de Cambio
- [x] Correccion de errores
- [x] Refactorizacion / Optimizacion acotada
- [x] Documentacion / Configuracion
- [ ] Nueva funcionalidad comercial sin aprobar

## Verificacion
- [x] Build de fuente34 exit0, incluido TypeScript y lint; no se afirma una
  ejecucion independiente de npm run typecheck en esa fuente.
- [x] Acentos2872 archivos PASS.
- [x] Jest comprobado COMPUESTO:739suites de amplia +1focal =740suites4660tests.
  La amplia tuvo1fallo de sonda por ResizeObserver ausente en jsdom. Se completo
  esa API ficticia y se preservaron todas las aserciones. No una corrida740verde.
- [x]52nativos PC/Pixel7 en fuente34:16ACK/CRM/documento,34IA/precios/roles/voz
  denegada o sin clave y2posicion/3D.17casos validos conservados del mismoSHA
  tras reparar sondas; los restantes ejecutados. Provider DOBLE LOCAL, no modelo real.
- [x]9smokes dependencias:ZIP/PDF/sanitizador/YAML/query/shell/glob/grpc/Hono/MCP/Three.
- [x]3D real software:738/1121colores, frames cambian al recorrer y se pausa.
- [x] SDKdemo0documentos, servicios/agentes cerrados, bytes ajenos restaurados.
- [x] Gate123 PASS_AI_PRICING_CHAT_POSITION_COMPATIBLE_PATCHES_ONLY.

## Impacto en Firebase
- [ ] Cambia reglas Firestore/Storage.
- [ ] Requiere nuevas Cloud Functions.
- [x] Cambia codigo web y dependencias; requiere nuevo despliegue.
- [ ] Requiere nuevas variables de entorno.

## Limites

No certificado de toda app ni0errores.30avisos GHSA residuales(107entradas
agregadas;1critical de FirebaseCLI),95seguimientos de evidencia, modelos/voz
reales,Hosting/OAuth/19documentos originales yhardware siguen fuera del cierre.
Los seis agentes de area se probaron cambiando ambito y respondiendo SIN acciones;
descuentos/regalos tienen prueba de motor unitario, no semantica de Gemini.
Los rojos de GitHub por facturacion no se usaron como fallo de app.

Resultados y sondas fallidas intactas:docs/evidencias/123-aceptacion.json,
123-cobertura-recuento.*,123-qa-incidencias.md yarchivos fuente SHA34.
