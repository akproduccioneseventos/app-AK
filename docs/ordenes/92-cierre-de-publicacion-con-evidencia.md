# 92. Cierre de publicacion: completar evidencia, no otra lista de funciones

Codex, 26/09/2026. Fuente contrastada: main `63dace0c83f990b8610833a56fb825624837ad6f`.
La rama de documentacion conserva ese codigo. No se autoriza publicar ni se declara
terminada la auditoria integral. Ver `docs/evidencias/92-matriz-lanzamiento.md`.
Recontrastar las ramas nuevas antes de programar. La orden 91 contiene los dos defectos
reproducidos; esta orden NO vuelve a pedir su implementacion.

## Claude: reunir evidencia reutilizable y cerrar la verificacion

1. Adjuntar el resultado reciente de la puerta que ya se registro como verde: commit,
   huellas de archivos si se reutilizo cache, entorno, comandos, resultados y excluidos.
   La documentacion antigua de agosto no sustituye esta evidencia. No repetir una corrida
   vigente solo porque se agrego este documento. El cache local `.ak-puerta-avance.json`
   puede servir como origen, pero no esta disponible en este clon; no asumir que no existe
   en el entorno de Claude.
2. Completar las filas pendientes de la matriz con cuentas y datos de prueba aislados.
   Para cambios no monetarios pendientes, Gemini implementa; dinero, comida y permisos,
   Claude. Codex revisa evidencias. No iniciar escrituras sobre las 19 fiestas reales.
3. Tras la correccion 91, ejecutar sus pruebas de fallo y concurrencia. Compilar el
   candidato final una sola vez y ejecutar controles de lanzamiento que no tengan
   evidencia vigente para su contenido. Registrar fallos y omisiones, no solo un total.
4. Verificar el despliegue de ESE candidato en Firebase y recorrer sus flujos principales.
   HTTP 200 en portada no demuestra el SHA desplegado ni que los cobros funcionen.
5. Las conexiones externas se prueban con una operacion controlada real o sandbox y
   resultado visible en ambos extremos. Una URL de perfil, un token presente o un booleano
   de configuracion no certifican sincronizacion. No publicar ni enviar mensajes reales
   al cliente para probar. No imprimir tokens en la evidencia.
6. El ensayo de equipos requiere el salon y dispositivos reales. Registrar resultados,
   no firmarlo desde una prueba simulada. Si falla una comprobacion, diagnosticar red,
   permisos, navegador, software y hardware: no atribuirlo automaticamente al equipo.

## Criterio de cierre

- Cero fallos criticos conocidos sin resolver en el alcance que se publica.
- Cada recorrido critico con resultado, version, entorno y evidencia; diferencias de
  cobertura documentadas. Existencia de archivo/test no equivale a prueba aprobada.
- Evidencia de persistencia, permisos y sincronizacion donde corresponda.
- Funciones dependientes de equipo o credenciales sin probar no se anuncian certificadas.
- El dueno decide publicacion y fusion. Nada se fusiona automaticamente.

No se solicitan nuevas funciones, redisenos ni dependencias. Esta es una orden de
verificacion. Si ya existe evidencia compatible, enlazarla en vez de repetir trabajo.
Las pruebas listadas debajo existen; su ejecucion actual completa no fue acreditada
por Codex en este entorno. Las del simulador modifican datos de prueba: nunca apuntarlas
a produccion ni usar cookies firmadas de los fixtures para entrar al sitio real.

```comprobar
archivo: docs/evidencias/92-matriz-lanzamiento.md
usa: processOfflineMediaQueue en src/components/offline/sync-status-indicator.tsx
# Existentes; pendientes de asociar a la evidencia del candidato final.
prueba: tests/e2e/simulator-budget-journey.spec.ts
prueba: tests/e2e/internal-smoke.spec.ts
prueba: tests/e2e/49-contabilidad-cobros-conciliados.spec.ts
prueba: tests/e2e/viaje-invitado.spec.ts
prueba: tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts
# Claude, 27/09: evidencia de la puerta y de la tanda completa sobre el candidato.
archivo: docs/evidencias/92-puerta-del-candidato.md
# Queda en FALTA hasta que el equipo de AK anote el resultado del ensayo físico.
archivo: docs/evidencias/ensayo-en-el-salon-resultado.md
```
