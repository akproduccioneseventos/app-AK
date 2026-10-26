# Fallo de preparacion, no diagnostico contra la app

658 vacio `src/data/galeria-publica.json` como si fuese privado. La portada y
salon-helper lo importan estaticamente y necesitan la propiedad fotos. Por eso
el compilador encontro `Property fotos does not exist on type {}`.

El fallo no se reproduce por ese motivo en el codigo original: el archivo
commiteado tiene fotos y fue restaurado por finally. No se cambia la app para
ocultar el diagnostico. Tampoco se afirma que esta compilacion haya aprobado.

660 conserva galeria-publica, catalogo-fotos y testimonials, todos publicos,
ademas de los catalogos ya preservados. Reutiliza el cache de la MISMA fuente
a3ecd008 en la MISMA copia congelada; no cambia dependencias ni usa un build
antiguo de otra fuente. El resto de los datos se mantiene ficticio/vacio.

Durante658 otra compilacion ajena comenzo despues del preflight. No se la
detuvo; hubo saturacion de RAM.660 espera que termine antes de iniciar.
