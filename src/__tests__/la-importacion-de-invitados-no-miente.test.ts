import { evaluarResultadoImportacionInvitados } from '@/lib/invitados/aviso-importacion-invitados';

describe('La importación de invitados no miente (Orden 61 - Pregunta 9)', () => {
  it('cuando todos los invitados se guardan bien, avisa éxito completo', () => {
    const res = evaluarResultadoImportacionInvitados({
      totalEsperados: 5,
      guardados: 5,
      fallidos: [],
    });

    expect(res.esCompleta).toBe(true);
    expect(res.esAMedias).toBe(false);
    expect(res.esFalloTotal).toBe(false);
    expect(res.titulo).toBe('Importación exitosa');
    expect(res.detalle).toContain('5 invitados');
  });

  it('cuando una parte falla, avisa que quedó a medias y nombra a los que faltaron con su motivo', () => {
    const res = evaluarResultadoImportacionInvitados({
      totalEsperados: 10,
      guardados: 7,
      fallidos: [
        { nombre: 'Juan Pérez', motivo: 'Error de red en Firestore' },
        { nombre: 'María González', motivo: 'Cupo de adultos agotado' },
        { nombre: 'Carlos Ruiz', motivo: 'Nombre duplicado' },
      ],
    });

    expect(res.esCompleta).toBe(false);
    expect(res.esAMedias).toBe(true);
    expect(res.esFalloTotal).toBe(false);
    expect(res.titulo).toContain('faltaron 3 de 10');
    expect(res.detalle).toContain('Juan Pérez (Error de red en Firestore)');
    expect(res.detalle).toContain('María González (Cupo de adultos agotado)');
    expect(res.detalle).toContain('Carlos Ruiz (Nombre duplicado)');
    expect(res.detalle).toContain('Las filas con error quedaron en la planilla');
  });

  it('cuando ninguno se pudo guardar, avisa fallo total sin decir que algo salió', () => {
    const res = evaluarResultadoImportacionInvitados({
      totalEsperados: 2,
      guardados: 0,
      fallidos: [
        { nombre: 'Ana López', motivo: 'Servidor no disponible' },
        { nombre: 'Pedro Silva', motivo: 'Servidor no disponible' },
      ],
    });

    expect(res.esCompleta).toBe(false);
    expect(res.esAMedias).toBe(false);
    expect(res.esFalloTotal).toBe(true);
    expect(res.titulo).toBe('No se pudo importar ningún invitado');
    expect(res.detalle).toContain('Ana López');
    expect(res.detalle).toContain('Pedro Silva');
  });

  it('cuando no hay filas válidas, no inventa datos', () => {
    const res = evaluarResultadoImportacionInvitados({
      totalEsperados: 0,
      guardados: 0,
      fallidos: [],
    });

    expect(res.esCompleta).toBe(false);
    expect(res.esAMedias).toBe(false);
    expect(res.titulo).toBe('Sin invitados para importar');
  });
});

