# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 21 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, **2053 pruebas en verde**,
compila, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** `docs/ordenes/6-la-resena-desde-el-invitado.md` (sin empezar) y
lo que quede de `ahora.md`.

## Lo más importante de hoy: el ingreso se colgaba

**El dueño no podía entrar, ni con la contraseña ni con Google.** Reproducido en un
navegador de verdad: el botón quedaba en "Ingresando..." para siempre, sin error y sin
poder reintentar. **La llamada al servidor no tenía ningún tope de espera**, así que si
el servidor estaba despertándose, la pantalla esperaba indefinidamente.

No era un error de programación: todos los caminos de error existían, pero ninguno se
alcanzaba nunca. Ahora hay tope de 25 segundos y un aviso mientras espera.

> **Lo que enseña:** una pantalla que "no hace nada" casi nunca está rota. Está
> esperando algo que no tiene tope. Buscá el `await` sin `Promise.race`.

## Las dos reglas que más encontraron esta semana

1. **Cuando algo pasa de correr en un solo lugar a correr en el navegador de cada uno,
   la pregunta no es "¿funciona?" sino "¿qué pasa si dos lo hacen a la vez?".** Con
   eso apareció un posteo que salía dos veces en las redes, la nota del blog pagada
   dos veces, y un permiso ampliado sin querer.
2. **Antes de dar por buena una herramienta que cuenta cosas, verificá a mano una
   muestra.** La auditoría reportaba 66 pantallas sin puerta y 44 sí la tenían.

## `npm run auditoria` ya existe, y hay que leer sus números bien

Cuenta cosas sobre los archivos, no opina, no usa inteligencia artificial. Hoy: **4
tareas sin rastro, 137 huérfanos, 1 dato simulado, 120 promesas.**

**No son 262 problemas.** Los 120 son frases para contrastar y casi todas son texto de
venta correcto; las tres que importaban ya se verificaron y **son ciertas**. El dato
simulado es un falso positivo verificado. Todo eso está anotado en
`docs/YA-RESUELTO.md`: **leelo antes de volver a revisarlas.**

De las 31 pantallas sin puerta quedan **9, y son exactamente las que no deben tener
enlace**: son redirecciones para que un enlace viejo no muera.

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
