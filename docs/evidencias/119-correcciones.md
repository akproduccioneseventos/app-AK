# Codex119 - Guardado manual despues de perder la respuesta

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
PR1293 abierta, main4c5ef2f9; no fusionar ni publicar automaticamente.

## Fallo observado

Fuente anterior662f123d, Next compilado + Firestore demo aislado.
Organizador abre /presupuestos/nuevo/crear, completa cliente/contacto ficticios,
elige DJ QA119 por1000 y conserva descuento manual predeterminado10%: total900.
La sonda deja llegar la peticion al servidor, consume la respuesta completa y
solo entonces la corta. La pantalla avisa Error al Guardar; SDK muestra1.
Al pulsar Finalizar y Generar otra vez, SDK muestra2 con numeros distintos.
El documento real abre en /ver: no era solamente una referencia encontrada.

119-manual-ack-antes-arreglo.json conserva1->2; la sonda inicial registraba
DEFECT_REPRODUCED pero salia0. No presentar ese exit0 como prueba aprobada.
La sonda final exige igualdad de documentos/CRM y sale1 si falla un criterio.

## Correccion directa autorizada

Fuente congelada a638c8508997fd9b55ed20962d9d4a7284d6cfc3.
CrearPresupuestoContent.handleSave prepara operationId antes del envio y lo
mantiene hasta confirmacion. savingRef bloquea la segunda entrada sincronica.
obtenerIntentoPresupuestoManual reutiliza el mecanismo de118 en namespace
separado del configurador. Recarga/timestamp nuevo mantienen el intento.
La confirmacion libera la clave; una cotizacion nueva identica sigue permitida.
No se deduplica por telefono, cliente ni fecha. Editar sigue updatePresupuesto.

No cambia precios, descuentos, regalos, ajuste anual, calculos, permisos,
registro de cupones ni enlace a fiesta. Usa la accion/transaccion atomica118;
no agrega dependencias de produccion. No reinicia configurador161 ya cerrado.

## Evidencia de fuente congelada

- Build a638 PASS: incluye lint y tipos; advertencias preexistentes conservadas.
- Acentos2852 PASS.
- 6 recorridos nativos PASS, PC1440x1000 y Pixel7:
  corte antes de envio + retry guarda1 por900; perdida de ACK + recarga + retry
  deja2->2 sin cambiar IDs/importes/numeros/timelineCRM; nueva cotizacion identica
  deja3, con2 cotizaciones legitimas del mismo telefono y3 numeros distintos.
  Cada destino /ver muestra nombre real y sigue visible tras recargar.
- SDK0 despues de detener app; ambos servicios apagados, bytes ajenos restaurados.
- 731suites4566tests PASS,0fallos/omitidos, manifiesto731 de la misma fuente.
  21unidades y tipos preliminares antes de congelar: no usar su SHA viejo como
  certificado de a638. 119-aceptacion.json PASS_MANUAL_ACK_ONLY.
- Grafo local actualizado14542nodos/43760relaciones/927comunidades, sinLLM;
  25avisos parciales del parser, no errores de TypeScript. No rehacer por docs.
- Agente economico ayudo solo con selectores/fixture; director reprodujo fallo,
  corrigio guardado sensible y verifico resultados. Agente cerrado.

## Limites / siguiente

Estos seis recorridos son del ALTA MANUAL, no de toda la app. No certifican
los reintentos de herramientas IA, proveedor de cupon real, fallo del enlace
a fiesta,19 documentos originales, Hosting, OAuth ni equipos fisicos.
152 sigue friccion registrada, no arreglo pendiente de este guardado.
118 configurador mantiene su evidencia historica; su nueva dependencia comun
esta incluida en unidades/broad, pero no se repite el recorrido nativo cerrado.
Restos de inventario109 requieren separar referencia/riesgo de defecto ejecutado.

```comprobar
archivo: src/lib/budget/intento-configurador.ts
usa: obtenerIntentoPresupuestoManual en src/app/(app)/presupuestos/nuevo/crear/page.tsx
prueba: src/__tests__/configurador-intento-recarga.test.ts
```
