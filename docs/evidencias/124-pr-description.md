## Descripcion del Cambio

Delta123 sobre main f04db066, que ya incluye la PR1293 y los arreglos
posteriores de Claude. No vuelve a entregar116-122 ni sustituye su trabajo.
CLAUDE FUSIONA; Codex no fusiona. Privado Claude NO CONTRASTADO.

- IA: precios por persona, tramos, ratio/personal, edades de menu infantil y
  campos cero usan el motor financiero. Servicios ambiguos/desconocidos no
  guardan una cotizacion parcial; repetidos no cobran dos veces.
- Chat: conserva el intentoA incierto cuando se confirmaB; reintento/recarga
  reutilizanA sin impedir una cotizacion nueva identica del mismo telefono.
- Tarjeta flotante: evita controles visibles conservando arrastre/minimizado;
  no promete evitar todo el texto ni cambia la prioridad comercial.
- Dependencias:19familias compatibles,56GHSA unicos retirados;30GHSA residuales
  documentados y orden163 para revision estructural sin force.
- Recuento compartido de421rutas;95seguimientos de evidencia NO son95bugs.
  Pregunta62 integrada al metodo de Claude para no repetir fallos de dependencias.

## Tipo de Cambio
- [x] Correccion de errores
- [x] Refactorizacion / optimizacion acotada
- [x] Documentacion / configuracion
- [ ] Funcionalidad comercial nueva sin aprobar

## Verificacion

Fuente integrada congelada:74258c9ffa3c8926327f1d8da74f0fffb0100e60.
La evidencia123 de34f45fbb queda HISTORICA, no valida este conjunto nuevo.

- [x]6suites52pruebas focalizadas nuevas PASS, incluido control de las ordenes.
- [x] Build124 exit0, tipos/lint incluidos; advertencias existentes preservadas.
- [x] Jest amplia124 unica:750suites4726tests,0fallos/omitidos.
- [x]52recorridos nativos NUEVOS PC/Pixel7 y9smokes PASS, sin reutilizacion.
- [x] Acentos2890 PASS; grafo14993/44500/947,0LLM;4avisos parser parcial noTS.
- [x] SDKdemo0; servicios y agentes propios cerrados; bytes ajenos restaurados.
- [x] Gate124 PASS_INTEGRATED_DELTA123_ONLY sobre la fuente742 congelada.

16casos ACK/CRM/documento,34precios/menus/intercalados/roles/voz bloqueada,
2posicion/3D. Guardar libre3/3PC y3/3celular; teclado/arrastre/minimizado.
Canvas real734/1142colores, mueve y pausa con SwiftShader, no GPU fisica.
Npm audit124 consultado de nuevo:30GHSA/107entradas/1criticalCLI; no seguridad total.
Recuento124 conserva95seguimientos de evidencia, sin inventar95errores nuevos.

## Impacto en Firebase
- [ ] Cambia reglas Firestore/Storage.
- [ ] Requiere nuevas Cloud Functions.
- [x] Cambia frontend/dependencias; requiere despliegue nuevo.
- [ ] Requiere variables de entorno adicionales.

## Limites

No0errores ni toda app certificada. Modelo/voz reales,Hosting/OAuth,
19documentos originales y hardware no comprobados. Seis roles: contexto y
respuesta sin ejecutar todas sus acciones. Dependencias residuales conservadas
como riesgo, incluido tar6 del FirebaseCLI. GitHub rojo por facturacion no es
un fallo de la app. Claude revisa/fusiona; esta propuesta NO publica por si sola.
