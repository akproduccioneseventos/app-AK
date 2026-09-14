# Orden 58 - Una demora no puede borrar datos

2026-09-14. PR1207 abierta, rama fix/estabilidad-arranque-apphosting, HEAD 29943cdd80ed7c14ceabc650544eb2aa304516a2.
Responsable: Claude para persistencia/datos y compilacion. Codex aporta evidencia.
No fusionar esta PR antes de resolver el riesgo P1. No crear otra PR por este documento.

## P1 STORE-01 reproducido en la tanda

src/lib/generic-json-store.ts: readGenericJsonFile convierte timeout de 2500ms en null.
src/lib/data-service.ts: updateDataPartial interpreta ese null como {}, mezcla el cambio
y llama syncGenericJsonFile, que hace set de todo el documento sin merge.

Sonda real de esas funciones, con IO simulado:
- Base {nombre:'Salon de prueba', capacidad:120}; cambio {nombre:'Nombre nuevo'}.
- Lectura normal: preserva capacidad, 1 escritura, sin error (CONTROL PASS).
- Lectura que no termina: queda solo nombre, 1 escritura, sin error (FAIL).
No son datos reales ni un caso observado en produccion. Es reproduccion aislada.
El peligro de tratar errores como ausencia preexiste; esta PR agrega el disparador timeout.

## Correccion requerida

Distinguir documento inexistente de lectura fallida/agotada en los caminos de escritura.
Ante lectura incierta, no reemplazar el documento con datos parciales ni devolver exito.
Usar actualizacion atomica/transaccion o fallo explicito segun el contrato existente;
preservar campos, arrays y semantica de deepMerge. No limitarse a aumentar el timeout.
Revisar consumidores de readGenericJsonFile para no convertir fallback publico en permiso
para escribir. No cambiar la experiencia ni permisos del usuario sin aprobacion.

Pruebas requeridas: documento existente con lectura lenta; ausencia real; lectura rechazada;
dos ediciones simultaneas; escritura que termina despues del timeout y posterior reintento.
Las dos ultimas son cobertura pendiente, no defectos nuevos certificados.
No rehacer AsistenteVirtual: el diff si limita su consulta a rutas publicas.

## Afirmaciones de la PR que faltan demostrar

apphosting.yaml cambia memoria 512->1024, pero cpu permanece 1.
Corregir el registro que dice aumento de CPU y que asegura evitar OOM: no hay medicion
de memoria/arranque que lo pruebe en esta revision. No afirmar solucion definitiva del 503.
Una promesa con timeout no cancela la operacion remota; documentar resultado incierto
de escrituras. No hemos reproducido un reordenamiento real en Firebase.

## Evidencia y limites

docs/evidencias/1207-timeout-datos.cjs extrae AST del SHA citado, Node24.19.0/TS5.9.3.
Ejecutar: node docs/evidencias/1207-timeout-datos.cjs RUTA_SNAPSHOT_O_REPO.
AUDIT_TYPESCRIPT opcional apunta a TypeScript externo. Reloj reducido a 10ms.
Se simulan Firestore, registro de ruta segura, logger, copia local y backup; no usa red
ni datos reales. 1 control PASS, 1 FAIL, salida 1. No build, E2E ni despliegue.
Graphify sigue sin grafo utilizable en la copia local desconectada; fuentes remotas puntuales.
PR1208 ya fusionada: no se audito como entrega abierta. PR1206 no cambio: no se repitio.
Claude debe agregar prueba de integracion al corregir; la sonda NO sustituye emulador/build.

```comprobar
archivo: src/lib/generic-json-store.ts
usa: readGenericJsonFile en src/lib/data-service.ts
prueba: docs/evidencias/1207-timeout-datos.cjs
```
