# Codex113 - Ajuste global de costos hasta menu consumidor

HEAD0122997c0a7780e786fb1c818e912a5137b443fa, 12/10/2026, PR1288 ABIERTA.
Fuente app8fa5b56a2833938541a657dcd15ef88130d24b0e. Main99faf4eb sin delta
en accion/menus/consumidor; NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Se completa uso de ajuste global pendiente111, no se repiten unidades66.

## Resultado conciliado

14criterios de PC1440x1000 y Pixel7:10PASS/4FAIL, dos familiasP1 paraClaude160.
Base principal113-costos-resultado.json: ochoPASS/cuatroFAIL/dosNOT_ACCEPTED.
Ultima ronda113-costos-consumer-resultado.json reemplaza SOLO esas dos
comprobaciones de consumidores, ambasPASS. No sumar reintentos como pruebas nuevas.

| Recorrido | PC | Celular |
| --- | --- | --- |
| Cancelar ajuste conserva inventario/menus | PASS | PASS |
| Transporte antes de envio: error, porcentaje y datos conservados | PASS | PASS |
| Reintento+10% actualiza insumo/receta kg y conserva stock | PASS | PASS |
| Receta250g conserva su magnitud y costo equivalente a0.25kg | FAIL | FAIL |
| Menu ajeno y precio de venta explicito50 no se pisan | PASS | PASS |
| Reabrir costo en ingrediente y editor de menu por enlace real | PASS | PASS |
| Respuesta200 perdida: reintentar+5% no vuelve a incrementar | FAIL | FAIL |

Unidad:250g se escribe como250kg; costo esperado27.5, persistido27500.
En celular de la etapa principal: esperado33.5, persistido33500. En la ronda
del consumidor se vuelve a ver27500 en editor real de PC. No fue cifra textual
solamente ni problema de conversion de formato monetario. Ver SDK/JSON/capturas.

Reintento: PC110->116->122, celular134->141->148. Redondeo a peso entero es
conducta vigente expresamente aceptada por la sonda, no un defecto inventado.
Primer guardado200 comprobado antes de cortar respuesta al navegador.

## Metodo

Firestore8085 demo propio y Next3301 ya compilado. Sin .env, credenciales,
mensajes, cobros, datos comerciales reales ni impresora. Solo modelo ficticio.
SDK prepara/comprueba fixtures, botones reales hacen cada ajuste. Se bloquearon
HTTPS externas y SOLO Next-Action de ajuste para simular transporte fallido.
Menus con unidades kg/g son compatibles con el modelo persistido Ingredient;
NO se afirma que el dueno haya cargado esa receta ni que la UI cree ese dato
de cero. Se comprueba tratamiento de recetas existentes con unidad de cantidad.

Receta equivalente por kg, stock2, menu no relacionado y precio50 pasan.
Consumidor usado: link `/empresa/menus/qa113_menu/editar` de pagina de Menus;
se espera URL y heading reales antes de leer. Nombre de plato colapsado visible;
PC muestra costos compactos. Celular trunca el nombre pero se mantiene accesible
en texto: oportunidad de claridad, no tercer defecto cuantitativo ni redisenio impuesto.

## Intentos excluidos del auditor

- Descubrimiento esperaba dialog en lugar de alertdialog;
  timeout propio conservado, no bloqueo de la aplicacion.
- Inicial: selector de costo equivocado y no contemplar Math.round vigente;
  esos NOT_ACCEPTED no son errores monetarios de la app.
- Principal: se leia DOM antes de terminar navegacion SPA; dos consumidores
  quedaron NOT_ACCEPTED. Ronda extra espera URL/heading.
- Ronda extra inicial: se buscaban nombres de platos en input; realmente son
  texto de tarjetas colapsadas. Se corrige solo sonda y se repiten SOLO dos casos.

No ocultar iniciales113-costos-inicial.json,113-costos-consumer-inicial.json,
execution/logs. La matriz final concilia por clave viewport/nombre/SHA, no cantidad
de ejecuciones ni salidaexit0 del verificador. Rondas nuevas del consumidor usan
el mismo modelo/compilacion, recalculando desde botones antes de reabrir.

## Cierre y continuidad

Fixtures y JSON restaurados byte a byte; cero documentos finales; servicios
propios cerrados comprobando parentesco/comando y puertos. Reinicio inicial de
QA para limpiar cache entre rondas no es nueva compilacion ni caida productiva.
Notificaciones ajenas preservadas por hash. Build/tipos/Jest106 reutilizado solo
por fuente app inalterada, no como aprobacion de estos dos errores.
Claude programa/compila160; Codex no cambia fuente ni fusiona. Correcciones
159 de mantenimiento siguen pendientes y no fueron reauditorias113.

Pedido nocturno del dueno: se activo heartbeat de este chat
`continuar-auditoria-ak-sin-repetir`, cada30min. Continua un recorrido pendiente
por corrida y reutiliza registro; no instala nada en produccion. Requiere
ejecucion/cuota disponibles. Pausar cuando solo queden permisos/datos/hardware
indispensables, sin consumir en bucle ni certificar0errores. No implica que
Claude/Gemini hayan recibido o comenzado a ejecutar estas ordenes.
