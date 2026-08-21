# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 21 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2069 pruebas en verde,
compila, seguridad de la base en verde, build de producción Next.js OK.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** ninguna.

## La auditoría quedó casi limpia

`npm run auditoria` hoy: **0 tareas sin rastro, 1 huérfano, 0 datos inventados,
1 promesa, 0 puertas cerradas de más.** Empezó el día en 4 / 201 / 1 / 120.

Los dos que quedan están mirados:

- **`receipt-processor.tsx`** es una función entera y andando —sacarle una foto a un
  comprobante y que la app extraiga los datos— que **no está enlazada desde ningún
  lado**. Se le avisó al dueño para que decida: enlazarla o borrarla. Gasta
  inteligencia artificial por uso, así que la decisión es suya.
- La otra es un **comentario dentro del código** que explica la regla de WhatsApp, no
  un cartel en pantalla. **Falso positivo.**

## Lo que se cerró el 21 de agosto

- **Las puertas abiertas a internet: de 247 a cero.** Todas protegidas o declaradas
  públicas con su motivo. En el camino, dos fugas reales: se le podía mandar al
  cliente un correo firmado por AK diciendo "pago confirmado" con cualquier monto, y
  el permiso para publicar en el Instagram de la empresa viajaba al celular de cada
  invitado.
- **El ingreso ya no se cuelga.** No tenía tope de espera: con el servidor
  despertándose, el botón quedaba en "Ingresando..." para siempre.
- **El botón de reseña para el invitado**, en el hub y en el álbum.
- **Las pantallas escondidas tienen puerta.** De 31 quedan 9, y esas 9 son
  redirecciones que no deben tener enlace.
- **Compatibilidad de Google Workspace en el cliente y estado de conexión de Spotify.**

## Cuatro reglas que salieron de errores de verdad

1. **Una pantalla que "no hace nada" casi nunca está rota: está esperando algo sin
   tope.** Buscá el `await` sin `Promise.race`.
2. **Cuando algo pasa de correr en un solo lugar a correr en el navegador de cada uno,
   la pregunta no es "¿funciona?" sino "¿qué pasa si dos lo hacen a la vez?".**
3. **Antes de agregar una comprobación, mirá si no está ya un nivel más abajo.**
   Ponerla dos veces no protege más y esconde dónde está la de verdad.
4. **Antes de cerrar una puerta, mirá quién la llama.** Cerrar de más no lo detecta
   ninguna prueba y deja al cliente afuera de lo suyo.

## Tres controles que ahora se cuidan solos

- **Ninguna marca de conflicto sin resolver**, en ningún archivo. Nació porque
  `apphosting.yaml` quedó con las marcas adentro y **el próximo despliegue no iba a
  arrancar**, sin que nada lo avisara.
- **Ninguna puerta pública cerrada de más.** Avisa qué pantalla se rompería.
- **Ninguna función de servidor abierta sin querer.**

## Lo que depende del dueño

**Nada urgente.** Conectar tres cuentas cuando quiera: Google Workspace, búsqueda de
canciones en Spotify y el puntaje de Google en el panel.

## Decisiones cerradas que NO se vuelven a preguntar

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido
  a propósito. Si una auditoría lo marca como problema de velocidad, es falso
  positivo.
- **Anotarse en directorios gratis: descartado.**
- **La reseña la pide la aplicación, también al invitado.** Ya está hecho.
- **El video de vida no lo toca la app.**
- **La llave de cobros no se cambia.** Se le propuso dos veces; dijo que no.
- **El WhatsApp es su número personal.** Ningún bot general, nunca.
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: la ficha va sin dirección, con zona de cobertura.
