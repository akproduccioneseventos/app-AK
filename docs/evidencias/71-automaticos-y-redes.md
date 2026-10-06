# Evidencia 71: automaticos, redes y sincronizacion

- Alcance/HEAD: solo lectura sobre `e52c07839563115236652229d73ac5ebf2e4e551`, rama `codex/auditoria-integral-20261006`.
- Se leyo `docs/YA-RESUELTO.md`, órdenes 66/69/70 y orden 117. AUTO01/02 y SOCIAL01 ya cubren candado general, resultados de tareas compuestas e identidad de creaciones; no se repiten.
- Mapa: consulta puntual de Graphify en `.audit-current-20261005`; guia al publicador, despachador automático, CRM y social-media. Es índice antiguo, no evidencia de implementación.
- PR1259: comparado `f836c128` con el SHA auditado. Su diff añade el tótem/video personal, elimina la ruta vieja del tótem y toca mapa/E2E; no modifica publicador automático, sync social ni CRM/agenda. Estado contrastado con commit suministrado; no se infiere estado remoto/merge.

## Hallazgos verificables

1. **AUTO03: observacion, no nuevo bloqueo confirmado.** La sonda principal ejecuta `procesarPosteosProgramados` y `ponerAlDiaAlEntrar` reales: sin credenciales de Facebook hay un elemento en `fallados`, `ok:true`, y el despachador registra la corrida sin error de tarea. Procesar una cola puede terminar bien aunque falle la entrega individual; el post conserva su error/intento y el siguiente ciclo puede reintentarlo. Se RETIRA la afirmacion de que esto impide reintentos. Revisar si la salud global distingue procesado de publicado, sin alterar la cadencia ni programar un cambio de negocio sin decision. Probe con persistencia y proveedores simulados, no envio real.

2. **RED03, P2: concurrencia de videos importados en el objeto de galeria.** La sonda principal ejecuta DOS llamadas reales a `syncInstagramPosts`, detenidas ambas despues de leer el mismo objeto `galeria-publica.json`. Feed ficticio A/B distintos: ambas contestan exito, pero el objeto final tiene solo `ig_B`, no la union. Fuente: snapshots en `src/app/actions/social-media.ts:246-248,402-408`; objetos genericos se reemplazan con `.set({_data: data})` en `src/lib/generic-json-store.ts:48-50`, sin fusion de sus arrays. Limite: storage en memoria, no carrera real de Firestore.
   - La sonda final tambien ejecuta el adaptador generico real (`syncGenericJsonFile` / `readGenericJsonFile`) con operaciones `.set/.get` simuladas. Se retira la afirmacion general sobre fotos/planificador: sus colecciones tienen marcas de lectura y transacciones en `firebase-sync.ts`; no pueden evaluarse con un mock de reemplazo total. Alcance sustentado: solo los videos del objeto generico. La identidad estable de Instagram ya corregida NO se reabre.

## Límites

- No se probaron conexiones vivas, credenciales, Meta/Instagram, Firebase, cron desplegado, ni dos instancias reales; no se afirma funcionamiento de integraciones externas.
- No se halló hallazgo adicional verificable de sincronización CRM/agenda tras revisar acciones/símbolos candidatos; no equivale a auditoría exhaustiva de esos flujos.
- Sin edición de la app, build, servidor o suite completa. Los probes son mocks/modelos locales, no pruebas de aceptación.
