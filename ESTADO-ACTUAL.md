# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 21 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 314 suites de pruebas en verde (2059/2059),
compila, build de producción de Next.js OK, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** ninguna.

## La auditoría quedó 100% limpia

`npm run auditoria` hoy: **0 tareas sin rastro, 0 huérfanos, 0 datos inventados,
1 promesa (comentario de código sobre WhatsApp, falso positivo), 0 puertas cerradas de más.**

- **`receipt-processor.tsx`** quedó enlazado y activo en el panel de **Gastos Generales** (`/empresa/contabilidad/gastos`) con escáner de recibos por IA opcional y auto-completado de campos.
- **Google Calendar / Workspace** quedó 100% conectado con la cuenta de servicio oficial de Google Cloud (`ak-calendar@presupuestador-ak-producciones.iam.gserviceaccount.com`).

## Lo que se cerró el 21 de agosto

- **Las puertas abiertas a internet: de 247 a cero.** Todas protegidas o declaradas
  públicas con su motivo.
- **El ingreso ya no se cuelga.** Con timeout seguro en autenticación.
- **El botón de reseña para el invitado**, en el hub y en el álbum.
- **Pruebas E2E en tandas automáticas y control de puertas públicas** en la auditoría (Pasada 5).
- **Las pantallas escondidas tienen puerta.** De 31 quedan 9 (redirecciones técnicas).
- **Lector de comprobantes por IA** habilitado en gastos generales.

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

- **Ninguna marca de conflicto sin resolver**, en ningún archivo.
- **Ninguna puerta pública cerrada de más.** Avisa qué pantalla se rompería.
- **Ninguna función de servidor abierta sin querer.**

## Ojo al revisar entregas de Gemini

**Tres veces seguidas** trajo la configuración de cobros de Mercado Pago, que apaga el
modo de prueba —deja los cobros en dinero real— sin la llave que valida los avisos de
pago. Vuelve porque cada entrega arranca de una copia vieja. **Revisar
`apphosting.yaml` en cada entrega.**

## Lo que depende del dueño

**Nada urgente.** Google Calendar ya quedó conectado con su cuenta de servicio.

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
