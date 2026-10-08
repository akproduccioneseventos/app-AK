# 129. Fotocabina: comprobar el resultado, no solo el clic

8/10/2026. Codex audita; Gemini corrige esta prueba; Claude valida/compila.
No cambia funciones del negocio ni pide reprogramar la fotocabina sin un defecto.
No fusionar documentacion sola. No usar facturacion de GitHub como senal.

## Contraste real

- Main actualizado: `09c8d814fdecdca00da71de7bc22c1d64ef0e662`.
- 1266/1267 ya fusionadas; no habia PR abierta al contraste final.
  La orden 128 YA tiene correcciones en main: no volver a encargarlas.
- Test inspeccionado: `tests/e2e/fotocabina-de-punta-a-punta.spec.ts`.
  Blob de main: `317875688da572ca3dd05279877ee932c7dd36cd`, sin cambios.
- UI aislada: `f790a002`, build `iZL-zBn4z4fNZ_IXFyUCN`.
  El test y los consumidores de esta revision no cambiaron entre ambos SHA.
  Esto NO demuestra que ese build sea la version publicada actual.

## Hallazgo TEST79-FOTO, P2 de verificacion

Area: estaciones. Commit: `09c8d814`.
La prueba titulada "la fotocabina saca la tanda y arma la tira de recuerdo"
comprueba camara, boton, ausencia de errores y texto tecnico. Despues espera
45 segundos, pero NO exige fotos, tira final, descarga ni entrega.

Reproduccion: `node docs/evidencias/79-sonda-oraculo-fotocabina.cjs`.
Extrae el callback y ejecuta SUS assertions reales. Con navegador/camara/esperas/
filesystem simulados, el clic no produce nada y se acepta; con error visible,
se rechaza. Resultado: `docs/evidencias/79-resultados/oraculo-fotocabina.json`.
Es una sonda del oraculo de prueba, NO un E2E ni prueba de fotocabina rota.
No contar esta sonda como otra prueba aprobada del producto.

## Correccion precisa, sin bajar exigencias

1. Mantener controles existentes; seleccionar explicitamente el modo tira.
   Usar boton real y condicion observable, no `.first()` generico ni una espera
   fija como prueba de que se completo la tanda.
2. Exigir la imagen final `Captura Final`, ya presente en la pantalla consumidora,
   cargada, con dimensiones validas y contenido de las tres capturas previstas
   por `FOTOS_POR_TANDA`. Verificar tira/orden/marca con datos de prueba conocidos;
   una pantalla de fondo o un PNG vacio no cuentan como recuerdo.
3. Descargar el recuerdo por el control real y abrir/comprobar el archivo:
   formato, dimensiones, contenido y diseno elegido. No comprobar solo el clic.
4. Separar captura/composicion/descarga local de subida/entrega a otro dispositivo.
   Para este ultimo caso, usar backend de PRUEBA funcional y recuperar el mismo
   recuerdo desde otra sesion. No fingir URL ni exito de Firebase.
5. Control negativo: si el disparo queda sin captura, si no aparece la tira o
   si falla la descarga, la prueba debe fallar por el resultado ausente. Con
   backend caido: mensaje real, cola/persistencia y reintento sin duplicacion.
6. Entregar JSON/traza con SHA, build, modo, resultado por etapa y saltados.
   Estado actual: **PENDIENTE** modificar/ejecutar estos casos.

No empezar todo de cero: existen otros casos en
`tests/e2e/entertainment-stations.spec.ts` (captura/video local del buzon),
`tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts` (marca configurada) y
`tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts` (corte/rechazo de subida
en fotocabina y 360). Se leyeron, NO se ejecutaron en este retest. Reutilizarlos
segun SHA y proposito; no afirmar que todo entretenimiento carece de pruebas.

Atencion al alcance: `tests/e2e/entretenimientos-a-fondo.spec.ts:338-352`
detecta `faltaLaBase` y excluye ese error de `fallas`. Es razonable no acusar
un fallo de producto por faltar backend de prueba; NO demuestra captura/entrega.
En el informe de lanzamiento debe figurar esa etapa como pendiente/bloqueada,
no aprobada por ausencia de errores. El modo negativo puede aprobar su mensaje
y la etapa positiva seguir sin ejecutar. No relajar ni reescribir ese caso
de abrir pantallas para fingir la verificacion de un recuerdo.

## Dependencia ya asignada, NO nueva orden duplicada

La base de prueba para mural/entrega sigue pedida en orden **114, punto 3**.
`getEntertainmentSession` devuelve null expresamente con JSON-only;
`startEntertainmentSession` requiere Firestore. No basta agregar insumos o
un token ficticio, ni instalar un emulador y dejar una politica que no lo use.
Claude debe proporcionar un entorno coherente y accesible desde este host,
sin cuentas/credenciales reales ni dependencias de auditoria en produccion.
Reutilizar la entrega existente si ya esta; comprobar antes de programar.
No emitir otra correccion de esa dependencia ni llamarla fallo publicado.

```comprobar
archivo: src/lib/entretenimiento/tira-fotocabina.ts
usa: componerTiraDeFotos en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/fotocabina-de-punta-a-punta.spec.ts (EXISTE; PENDIENTE fortalecer y ejecutar resultado positivo/negativo)
archivo: src/app/actions/fiesta/sesion-entretenimiento.ts
usa: startEntertainmentSession en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/fotocabina-de-punta-a-punta.spec.ts (PENDIENTE backend de prueba y entrega; no declarar aceptada)
```
