# PARA GEMINI - Orden 197: URGENTE, primero la plata y los permisos, en una propuesta chica aparte

**Por qué existe (dueño, 20/10/2026):** *"no funcionó, ya que seguía el error"*.

El error de los pagos a proveedores con el mismo nombre se conoce desde el **16 de octubre**, y todavía
está en la app publicada. No se arregló porque viajó dentro de entregas grandes (1333 y 1337) que se
devolvieron por otras cosas: por cada novedad que fallaba, el arreglo de plata volvía a esperar.

**Desde ahora, lo de plata y permisos que ya está roto en la app publicada va primero y solo.**

## Cómo se entrega

- **Una propuesta CHICA y APARTE.** Rama nueva desde `claude/app-debug-stabilize-m70e6z`, y la
  propuesta contra esa misma rama.
- **Sólo** estos bloques. Nada de novedades, pantallas ni entretenimiento.
- La propuesta grande (1337, con las órdenes 188 a 196) sigue por su lado. Cuando hagas en la 197 un
  bloque que también está en la 193 o la 194, **no lo repitas en la 1337**.
- Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero.

## Qué entra, en este orden

Lo que hay que hacer está escrito, con archivo y línea, en las órdenes de origen. Hacelo tal cual:

1. **Orden 194, bloque 1:** el despertador no llega a la app. Sin esto no corre ninguna tarea
   automática.
2. **Orden 193, bloque 2:** pagos de proveedores cruzados por nombre (con lo que agregó Codex: con la
   lista de compras, `updateShoppingListStatus`).
3. **Orden 193, bloque 1:** funciones internas que se pueden llamar desde el navegador, y
   `changePassword` sin sesión.
4. **Orden 194, bloque 2:** permisos y quién entra, entero:
   - el ingreso con Google sin perfil;
   - las preguntas de seguridad sin tope;
   - el eco de WhatsApp;
   - ganancias y sueldos;
   - el portal del proveedor.
5. **Orden 198, entera:** lo que devuelve un guardado le mostraba costos y sueldos ajenos a quien no
   tiene permiso (lo encontró Codex; Claude sumó dos lugares más).
6. **Orden 193, bloques 4 y 5:** saldos sin el ajuste anual, y un cobro a confirmar contado como
   ganancia.

Si un bloque se traba, entregá los otros y avisá cuál faltó. **No esperes a tenerlos todos.**

## Pruebas

Las de cada orden de origen. Además, **cada arreglo de plata trae el caso "alguien sin permiso"**
(perfil `personal` y perfil `operador`) con datos de la forma real (pregunta 37).

```comprobar
usa: /api/cron-despachador en src/lib/auth/public-paths.ts
usa: perfilDesdeRolViejo en src/app/actions/simple-auth.ts
usa: messageId en src/app/api/whatsapp/webhook/route.ts
usa: GANANCIAS en src/app/actions/comparativa-ganancias.ts
prueba: src/__tests__/el-despertador-pasa-la-puerta.test.ts
prueba: src/__tests__/auditoria-gemini-20-10-permisos.test.ts
```
