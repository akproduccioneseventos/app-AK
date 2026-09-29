# 113 — Endpoint Multiagente sin límite de solicitudes por sesión

**Clasificación:** NO CONTRASTADO CON LA TANDA. Revisión estática de main; no ordenar implementación hasta comparar con la rama de trabajo activa.
**Severidad sugerida:** P2 (abuso/costo/disponibilidad; requiere validar mitigaciones de infraestructura).

## SHA y alcance

- Rama/código observado: `main`, SHA `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`.
- Endpoint: [route.ts](https://github.com/akproduccioneseventos/app-AK/blob/975118a8d2f22868f9cdffc1fa6d8c245ba75fd0/src/app/api/multiagent/message/route.ts).
- Consumidor real: el endpoint llama `sendPersistentMultiAgentMessage` desde [multiagent.ts](https://github.com/akproduccioneseventos/app-AK/blob/975118a8d2f22868f9cdffc1fa6d8c245ba75fd0/src/app/actions/multiagent.ts); este ejecuta `sendMultiAgentMessage`, que invoca el flujo Gemini.
- Autorización: `POST` verifica sesión y responde 401 si no existe. No es un endpoint anónimo.

## Observación

En el handler de `POST` no se observa límite de frecuencia, cuota por usuario/sesión, ni límite de solicitudes simultáneas antes de invocar el flujo de IA. La acción persistente vuelve a verificar sesión, pero no limita frecuencia. El handler acepta `imageDataUri` de hasta 6.000.000 caracteres y ejecuta `request.json()` antes de esa validación de campo.

Esto permitiría a una cuenta interna autenticada emitir solicitudes repetidas y costosas; un cuerpo JSON grande también se parsea antes de aplicar el tope de imagen. No hay evidencia de abuso, facturación causada ni incidente de disponibilidad.

## Contraste y límites

- Confirmado por lectura del código en el SHA indicado; no se hizo una prueba dinámica, no se llamó a Gemini y no se generó tráfico.
- No se revisaron límites del proxy/CDN, plataforma de despliegue, cuotas del proveedor Gemini ni configuraciones externas. Pueden existir mitigaciones fuera del código.
- No se inspeccionó la tanda activa; por eso queda **NO CONTRASTADO CON LA TANDA**.
- No solapa con los hallazgos 111–112 (persistencia concurrente y selección ambigua de tarea).

## Validación sugerida para quien programe

1. Contrastar el SHA y la rama activa; revisar rate limits externos antes de duplicar protecciones.
2. Definir un límite razonable por usuario/sesión, limitar concurrencia y rechazar cuerpos excesivos antes de procesarlos si la plataforma lo permite.
3. Probar que ráfagas excedidas reciben una respuesta controlada, usuarios distintos no comparten cuota indebidamente y las consultas normales (incluida imagen permitida) siguen funcionando.
4. Verificar comportamiento en entorno desplegado y consultar métricas/costos; la revisión estática no demuestra impacto financiero.

```comprobar
archivo: src/app/api/multiagent/message/route.ts
usa: POST en src/app/api/multiagent/message/route.ts invoca sendPersistentMultiAgentMessage en src/app/actions/multiagent.ts
prueba: pendiente — falta una prueba de límite por sesión/rate limit que atraviese el endpoint
```
