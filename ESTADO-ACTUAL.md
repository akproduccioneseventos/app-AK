# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**22 de septiembre de 2026.** Rama `fix/traspaso-22-septiembre`, sólo con esta hoja.
**Todo lo de hoy ya está fusionado y publicándose** (propuestas 1211, 1212 y 1213, las tres
con la verificación completa en verde).

## Lo que entró hoy

- **No se podía entrar a la app.** Una lectura colgada de la base tumbaba la pantalla entera:
  se veía el error del servidor. Ahora corta a los ocho segundos y usa el respaldo. Ya entra.
- **Calendario:** arrastrar una reunión reprogramaba la fiesta y le avisaba al cliente; una
  fecha rota vaciaba el calendario; las fiestas de noche salían al día siguiente y bloqueaban
  el día equivocado para vender; una fecha imposible se guardaba como otra.
- **Plata:** el contrato de seña imprimía la fecha corrida un día, y cuatro botones decían
  "copiado" sin serlo.
- **Barra:** un trago que no se guardaba dejaba las botellas descontadas y decía "pedido
  enviado" mientras al barman no le llegaba nada.
- **Ingreso con Google** ahora dice qué falló; la recuperación no deja códigos que nadie recibió.
- **De Gemini:** los ocho enlaces muertos y la portada sin cajas grises. Le corregí dos cosas.

## Espera decisión del dueño

- **Subir la memoria del servidor.** Lo último de la caída de producción, y lo único que
  **aumenta la factura mensual**. Está en la propuesta 1207, que ya choca con el resto.

## Pendiente, y es mío

- **Siete carteles más que dicen "copiado" sin serlo**: activos fijos, insumos, menús,
  alergias, clientes, administración y cambio de fecha contractual. Listados por Gemini en
  `docs/auditoria/BARRIDO-PREGUNTAS-NUEVAS.md`.
- **De Codex, sin mirar:** dos personas editando fotos o salones a la vez pierden cambios, y
  borrar la última foto o el último salón puede dejar el registro guardado igual.

## Espera a Gemini

Órdenes **74**, **75** y **77**, más las devoluciones ya escritas en `docs/ordenes/`.

## Trampas que no se repiten

- La sesión del equipo son **dos mitades** (`ponerSesionDelEquipo`).
- **No se sube lo que escribe la corrida**: `npm run limpiar:corrida`.
- **No se toca código ni se sube mientras corre la verificación**: la tira abajo.
