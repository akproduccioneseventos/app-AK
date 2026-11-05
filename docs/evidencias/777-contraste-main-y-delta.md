# 777 - Contraste de entrega y delta, 4/11/2026

Base verificada: 31662b207f570ab240527214f6a63880da6be2d2 (main).
No contrastado con cambios privados no publicados. Codex no fusiona.

## No integrar la tanda vieja entera

Mientras se preparaba 764, Claude/Gemini integraron 1377, 1378 y 1379.
La implementacion local previa se conserva en c16f5c48e, NO se propone para
fusion: sobrescribiria pantallas y decisiones nuevas. Sus pruebas sobre e6db627
no certifican main actual. Los cinco agentes usados terminaron y estan cerrados.
No se reprograman barra242, portada245, demo246 ni ficha248 de aquella entrega.
Eso significa correccion presente en main, NO nueva aceptacion nativa por Codex.

## Delta necesario observado en la fuente actual

- Historicos: main ya evita choques de numero con hash; se conserva ese arreglo.
  Faltaba evitar identidad por milisegundo cuando no se entrega intento, y la
  recuperacion de una factura antigua podia atribuirla por sus ultimas cinco
  letras sin verificar cliente. Ahora usa UUID sin intento y exige cliente
  estable para recuperar documentos antiguos sin enlace. No cambia numeros
  existentes, cobros, formulas ni datos reales.
- Respaldo publico: el error de lectura devolvia JSON con costo/proveedor/notas
  y costos/ingredientes/margen de menus. Se recortan tambien esos respaldos,
  preservando precios de venta y el aviso existente de Gemini. No se cambia
  su API de prueba ni se presenta la lectura fallida como informacion viva.
- Precio: la ultima respuesta humana16900 sustituye20000. Configuracion vieja
  sin revision se normaliza; cambios autenticados futuros guardan revision y
  se respetan. La ficha del simulador toma ese mismo precio. Se mantiene36000
  de referencia ya presente en main, sin inventar otro precio tachado ni
  agregar el alquiler al total de servicios de AK.

## Evidencia y limites

777: tres suites focales, 17 PASS, cero fallos/omitidos, antes del ajuste de
precision de la asercion de precios. Se conservan resultados originales.
778: cuatro suites,24PASS0FAIL0omitidos, incluye comprobar realmente precioVenta,
precioPorPersona y calculationMethod, no una propiedad precio inexistente.
ESLint focal de seis archivos PASS sin advertencias/errores.779 registra la
repeticion sobre fuente congelada9ab4b9239, no se suman24dosveces.
Tipos globales4/11: proceso14284 desaparecido sin recibo final y log vacio;
INCONCLUSO. No reutilizar tipos de la rama764 ni afirmar que este chequeo paso.
Fronteras de datos/actor/proveedor con dobles locales. No son integraciones
reales, pruebas de cada rol/control, un build nuevo ni publicacion.
Claude conserva compilacion final, pruebas nativas y fusion.
No se modifica produccion, cuentas, cargos, envios ni procesos ajenos.
