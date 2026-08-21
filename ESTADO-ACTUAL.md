# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 21 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, pruebas en verde (incluidas pruebas de puertas de servidor en cero pendientes, pantallas sin puerta y reseña del invitado), compila, seguridad de la base en verde, build de Next.js OK.
**Propuestas abiertas:** ninguna.
**Órdenes resueltas:**
1. **Orden 6: La reseña, también desde el invitado** (`docs/ordenes/hechas/6-la-resena-desde-el-invitado.md`, completada y testeada con 8 pruebas).
2. **Puertas de servidor:** 100% protegidas y auditadas (`puertas-pendientes-de-revisar.json` en `{}`).
3. **Afinamiento de auditoría mecánica continua:** `scripts/auditoria.mjs` refinado, 1 hallazgo real, cero falsos positivos.
**Órdenes pendientes:** ninguna urgente.

## Lo más importante de hoy: reseña del invitado y seguridad cerrada

1. **Botón de reseña de Google para el invitado (Orden 6):** Se incorporó el botón discreto y opcional en el hub del evento (`/evento/hub/[fiestaId]`) y al pie del álbum de fotos (`/evento/album/[fiestaId]`), utilizando `getEnlaceDeResenaPublico()`. Solo se muestra si el enlace de Google está cargado en Ajustes. No condiciona ni pide estrellas fijas para cumplir las políticas de Google.
2. **Puertas de servidor:** Se auditaron y protegieron con `requireAppSession()` todas las Server Actions administrativas en `src/app/actions/`. Las funciones públicas legítimas quedaron formalmente declaradas en `auditoria-puertas-abiertas.test.ts`. El archivo de pendientes quedó en cero.
3. **Auditoría mecánica continua (`scripts/auditoria.mjs`):** Se eliminó el ruido de falsas alarmas (rutas en Windows, detección kebab/PascalCase, barrel files, exclusión de términos gastronómicos reales como mocktails y filtrado de ayudas de UI). El reporte en `auditoria-out/informe.md` ahora devuelve números limpios y precisos (1 hallazgo real comprobado).

## La regla que más encontró esta semana

**No son 262 problemas.** Los 120 son frases para contrastar y casi todas son texto de
venta correcto; las tres que importaban ya se verificaron y **son ciertas**. El dato
simulado es un falso positivo verificado. Todo eso está anotado en
`docs/YA-RESUELTO.md`: **leelo antes de volver a revisarlas.**

De las 31 pantallas sin puerta quedan **9, y son exactamente las que no deben tener
enlace**: son redirecciones para que un enlace viejo no muera.

## Las puertas: de 84 a 49, y una fuga seria

**Cualquiera podía mandarle avisos falsos al cliente.** Las funciones que mandan el
correo de "pago confirmado" y "pago rechazado" eran direcciones abiertas: con sólo
saber el número de una fiesta se podía hacer que la aplicación le mandara al cliente
un mail firmado por AK con el monto que se quisiera. La pantalla donde el equipo
aprueba sí pedía cuenta; el agujero era que se podía saltear la pantalla. Cerrado.

**De las 84 que figuraban abiertas, 49 lo estaban sólo en apariencia.** Casi todo lo
que toca una fiesta escribe a través de `saveFiesta`, que adentro pide sesión del
equipo o la clave del cliente de esa fiesta: la comprobación estaba un nivel más abajo
y el control no la veía. Ahora la reconoce, **exigiendo además que la función no
escriba nada por su cuenta**, así que no se aflojó nada.

> **Lo que enseña:** antes de agregar una comprobación, mirá si no está ya un nivel más
> abajo. Ponerla dos veces no protege más y esconde dónde está la de verdad.

Quedan **49**, y son casi todas de leer contenido público: blog, catálogo, promos,
galería, simulador, portal del proveedor con su token.

## Lo otro que se cerró hoy

- **El cartel de las cuentas bancarias mentía.** Decía que se sincronizaban con cada
  fiesta; sólo se copian a una fiesta que aún no tiene ninguna. Si el dueño cambia su
  cuenta, las fiestas viejas le siguen mostrando la anterior al cliente.
- **A la entrega de la orden 5 se le sacó la configuración de cobros de Mercado Pago**,
  que venía a medias: apagaba el modo de prueba (dinero real) sin la llave que valida
  los avisos de pago. Prender los cobros es una decisión aparte del dueño.
- **Cuatro pantallas escondidas ya tienen puerta**: compras, alergias, portal de
  proveedores y cláusulas de contrato.

## Lo que depende del dueño

**Nada urgente.** Sólo conectar tres cuentas cuando quiera: Google Workspace, búsqueda
de canciones en Spotify y el puntaje de Google en el panel.

## Decisiones cerradas que NO se vuelven a preguntar

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido
  a propósito. Si una auditoría lo marca como problema de velocidad, es falso
  positivo: la app contesta entre 5 y 25 milésimas y las páginas de venta salen
  armadas de antes, así que el prospecto que llega de Google no espera.
- **Anotarse en directorios gratis: descartado (21 de agosto).**
- **La reseña la pide la aplicación, también al invitado (21 de agosto).** Falta sólo
  el botón, en la orden 6.
- **El video de vida no lo toca la app.**
- **La llave de cobros no se cambia.** Se le propuso dos veces; dijo que no.
- **El WhatsApp es su número personal.** Ningún bot general, nunca.
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: la ficha va sin dirección, con zona de cobertura.
