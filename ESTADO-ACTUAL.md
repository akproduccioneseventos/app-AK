# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 17 de septiembre de 2026. **Rama: `fix/despertador-de-afuera`**,
con la verificación completa **en verde** y **sin fusionar todavía**.

## Lo que está listo para entrar

- **Respaldos:** una lectura fallida ya no se guarda como copia completa. Leer casi nunca tira
  error —devuelve vacío—, así que se guardaban cero datos marcados como buenos y la rotación
  borraba la copia buena.
- **Reportes y recordatorios en hora de Uruguay.** Un cobro de la noche del último día ya no cae
  en el mes siguiente, y una cuota no se avisa un día antes.
- **Encuesta post fiesta:** no se cuelga en "Enviando...", dos respuestas a la vez no se pisan, y
  no se aceptan notas de 99 ni campos internos mandados desde el navegador.
- **Diez guardados que reescribían la lista entera ahora tienen turno** (ingredientes, menús,
  ajustes de precio, ficha de empresa, plantilla de facturas, reparación de fechas).
- **Cuatro botones de plata** ya no quedan girando para siempre.
- **El método pasó de nueve a quince preguntas** (`docs/ANTES-DE-ENTREGAR.md`).

## Lo que falta

- **Fusionar.** El entorno de esta sesión no deja fusionar solo: quedó pedido al dueño.
- **Órdenes escritas para Gemini, sin empezar:** la 63 (TikTok dice "Publicado" mientras procesa)
  y la 64 (pantallas del invitado con las preguntas nuevas). Siguen abiertas la 55 y la 56.
- **Acelerar el navegador.** Está medido: 24 a 31 minutos de los 40. Desde ahora cada corrida
  imprime **las cinco pruebas más lentas**; con esa lista se ataca en la próxima vuelta. El
  detalle, en `docs/DONDE-SE-VA-EL-TIEMPO.md`.

## Trampas que costaron tiempo y no se repiten

- **Nunca barrer procesos con `pkill -f`**: el patrón caza el propio comando y mata la sesión.
- **Lo que escriben las pruebas no se sube**: `npm run limpiar:corrida` después de cada tanda.
- **No correr nada mientras corre la verificación.**
