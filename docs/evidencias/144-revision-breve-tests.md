#144 - Revision breve de cambios nuevos en pruebas

Codex solo lectura/documentacion. Alcance NO revisado en contenido en142:
diff de17d26a631f500a263c48c4973d9c6f57d56ba421 a
a98a4b25009f9994d7a9cbd3025972a4142634c2, PR1327 ABIERTA contrastada por API.
Antes solo se habia enumerado este delta para reutilizar el mismo runtime.

Archivos revisados: tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts,
tests/e2e/pantallas-con-iconos-react19.spec.ts ytests/e2e/public-smoke.spec.ts.

Resultado: no se borran aserciones ni se agregan skips en estos tres diffs.
Cambios: plazo60->120segundos en demo, plazos180segundos en dos recorridos
publicos y expectativas de textos corregidas con tildes. No un bug nuevo.

Limite importante: pasar estas pruebas NO garantiza una web rapida: ahora
permiten esperar dos/tres minutos. Propuesta separada, no bloqueo ni orden:
medir rendimiento con un umbral propio cuando haya recursos. No se midio
velocidad ni se ejecuto navegador/build en esta revision pequena.

No se reviso contenido del cuarto archivo layout-baseline.json ni se acepta
la PR completa, todos los roles ni toda app. Sin cambio de app ni merge.
Fuente de evidencia: git diff de los dos SHA y tres rutas anteriores; no
otra corrida de las auditorias134-143. Graphify consultado con presupuesto250.
