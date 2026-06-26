---
name: ak-eventos-expert
description: Especialista en diseño, desarrollo web, CRM, presupuestos y landing page comercial pública para AK Producciones en Salto, Uruguay.
---

# Habilidad Experta: Desarrollo, Diseño y Marketing para AK Producciones

Esta guía de habilidades consolida las especificaciones técnicas del proyecto, los requerimientos comerciales generados por ChatGPT, los comentarios de la web pública de la productora, y las reglas operativas del negocio de eventos. Debe ser respetada e implementada en cada iteración del código.

---

## 1. Reglas de Diseño, Experiencia de Usuario (UI/UX) y Landing Pública

* **Separación de Entornos (Público vs. Privado):**
  * La página pública/landing de marketing debe abrir siempre en el root `/` sin requerir ningún tipo de login o autenticación del visitante.
  * El sistema privado y paneles interactivos deben quedar estrictamente separados en las siguientes rutas protegidas: `/login`, `/dashboard`, `/app`, `/admin`, `/clientes`, `/presupuestos`, `/eventos`.
  * Nunca se debe bloquear la página de inicio principal con un login obligatorio.
* **Paleta de Colores Corporativa:** Exclusivamente colores Indigo y Slate con estética Premium, vibrante y moderna. Está terminantemente prohibido el uso de la paleta roja conflictiva anterior en cualquier elemento visual de la landing o de la aplicación.
* **Prohibido el uso de `!important`:** No se deben inyectar estilos CSS utilizando `!important` que rompan la cascada nativa y la flexibilidad responsiva de Radix UI o TailwindCSS.
* **Optimización de Medios (LCP):** Está prohibido el uso de la etiqueta HTML nativa `<img>` para renderizar imágenes del catálogo o de decoración. Se debe usar siempre el componente `<Image />` de `next/image` con la propiedad `sizes` optimizada para dispositivos móviles (los clientes de Salto acceden mayoritariamente desde smartphones).
* **Salón Club Uruguay y Módulo de Tecnología:**
  * Destacar el **Salón Club Uruguay** como el salón preferencial y exclusivo de la productora en Salto, integrado con servicios completos de fiesta.
  * Promocionar activamente el **Módulo de Tecnología Interactiva** (pistas de luces LED, pantallas gigantes, fotocabinas 360, muro social interactivo en tiempo real) como diferenciador principal.

---

## 2. Vocabulario y Copy Comercial Estricto (Reglas de la Productora)

* **Idioma y Tono:** Comunicación en español rioplatense uruguayo usando modismos naturales ("vos", "bo", "che").
* **Vocabulario Comercial Obligatorio:**
  * Usar siempre **"comida"**, nunca "catering".
  * Usar siempre **"discoteca"**, nunca "DJ" ni "disc jockey".
  * Destacar en textos, títulos y banners las frases clave: **"servicio integral"**, **"fiesta completa"** y **"todo en un solo lugar"**.
* **Copys Principales del Hero de la Web:**
  * Título: `"Organizá tu fiesta completa en Salto con AK Producciones"`
  * Subtítulo: `"Salón, comida, discoteca, decoración, fotografía, filmación, barra y coordinación en un solo lugar."`
  * Botones de Acción: Limitar a dos llamadas a la acción principales: "Simular Presupuesto" (redirige al simulador interactivo público) y "Contacto por WhatsApp".

---

## 3. Reglas del Motor Financiero y de Presupuestos

* **Duración de Eventos:**
  * Menos de 4 horas: Se considera fiesta chica y habilita un máximo de 1 entrada de comida.
  * 4 horas o más: Se considera fiesta grande y habilita hasta 2 entradas de comida.
* **Cálculo de Invitados por Categoría:**
  * Comida infantil/menores: Suma estricta de Niños + Adolescentes.
  * Platos adultos: Suma estricta de Adultos.
  * Servicios generales (Salón, Luces, Pantallas, Discoteca): Suma total de Adultos + Niños + Adolescentes.
* **Cálculo de Ajuste Inflacionario Anual (Fórmula Continua):**
  * Está prohibido calcular la inflación basándose únicamente en años enteros simples (`event.getFullYear() - created.getFullYear()`).
  * Debe calcularse de forma fraccionaria continua basada en la diferencia real de días entre la fecha de creación del presupuesto y la fecha del evento:
    ```typescript
    const timeDiff = event.getTime() - created.getTime();
    const yearsDiff = Math.max(0, timeDiff / (1000 * 60 * 60 * 24 * 365.25));
    ```
* **Validación de Pagos y Guardrails:**
  * Prohibido registrar pagos por montos superiores al saldo restante del presupuesto del cliente.
  * Los pagos pendientes o rechazados no deben sumarse a los ingresos confirmados del negocio en los dashboards analytics.
  * Validar siempre contra la función `validatePaymentAgainstBudget()` en `financial-guardrails.ts`.

---

## 4. Arquitectura del Backend, Seguridad y Firebase

* **Escritura Dual y Tolerancia a Fallos:**
  * Firestore de Firebase es la única fuente de la verdad para todos los entornos.
  * Al realizar escrituras en Server Actions, si se detecta un fallo de red o conexión con Firestore, no se debe colapsar la experiencia del usuario; el sistema debe registrar un warning interno y guardar la información en la colección genérica de respaldo (`json_documents`).
  * Toda llamada a `writeData`, `syncToFirestore` o persistencia debe envolverse en bloques `try/catch` o `.catch()` para evitar excepciones no controladas.
* **Seguridad de Sesión y Lockout:**
  * Las contraseñas y accesos deben validarse utilizando el cifrado `scrypt` con sal (salt) y comprobación temporal resistente a ataques de sincronización en `simple-auth.ts`.
  * Mantener el bloqueo preventivo (`LOCKOUT_MS`) de 15 minutos tras 5 intentos consecutivos fallidos de inicio de sesión o recuperación de credenciales.
* **Compatibilidad de Despliegue en Firebase App Hosting:**
  * Antes de proponer o subir cualquier cambio, es obligatorio validar que Next.js compile en producción ejecutando la compilación local (`npm run build`) con un límite de heap configurado si es necesario (`NODE_OPTIONS="--max-old-space-size=4096"`).

---

## 5. Criterios de Comunicación del Asistente

* **Perfil del Usuario:** El usuario no es programador. Evitá tecnicismos de bajo nivel o explicaciones complejas de la estructura de base de datos.
* **Respuestas Cortas e Informativas:** Sé directo, breve y conciso en tus respuestas. Ve directo al grano.
* **Sin Bloques de Código en el Chat:** Está prohibido incluir fragmentos o bloques de código de programación (TypeScript, CSS, HTML) en los mensajes del chat de respuesta directa al usuario. Todas las implementaciones técnicas deben guardarse directamente en los archivos correspondientes del repositorio y explicarse al usuario de forma funcional.
