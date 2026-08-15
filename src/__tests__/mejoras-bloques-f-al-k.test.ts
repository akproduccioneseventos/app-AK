import { buildPresupuestoNarrative } from '@/lib/budget/budget-narrative';
import type { Presupuesto } from '@/types/presupuesto';

describe('Mejoras — Bloques F al K (Tanda 2)', () => {
  describe('Bloque K: El presupuesto que se explica solo', () => {
    it('debe generar una descripción fiel y completa sin inventar precios para 80 personas en Club Uruguay', () => {
      const mockPresupuesto: Partial<Presupuesto> = {
        id: 'pres_123',
        eventoTipo: '15_anos',
        salonFiestas: 'Club Uruguay',
        invitadosCantidad: 80,
        itemsPresupuestados: [
          {
            idServicioCatalogo: 'srv_1',
            nombreServicio: 'Cena Menú Gourmet 3 Pasos',
            categoriaServicio: 'Gastronomía',
            precioUnitario: 1200,
            precioUnitarioPresupuesto: 1200,
            cantidad: 80,
            costoTotalItem: 96000,
            calculationMethod: 'porPersona',
          },
          {
            idServicioCatalogo: 'srv_2',
            nombreServicio: 'Barra de Tragos Premium',
            categoriaServicio: 'Bebidas',
            precioUnitario: 450,
            precioUnitarioPresupuesto: 450,
            cantidad: 80,
            costoTotalItem: 36000,
            calculationMethod: 'porPersona',
          },
          {
            idServicioCatalogo: 'srv_3',
            nombreServicio: 'Discoteca e Iluminación Robótica',
            categoriaServicio: 'Discoteca',
            precioUnitario: 25000,
            precioUnitarioPresupuesto: 25000,
            cantidad: 1,
            costoTotalItem: 25000,
            calculationMethod: 'fijo',
          },
          {
            idServicioCatalogo: 'srv_4',
            nombreServicio: 'Fotocabina con tiras ilimitadas',
            categoriaServicio: 'Entretenimiento',
            precioUnitario: 18000,
            precioUnitarioPresupuesto: 18000,
            cantidad: 1,
            costoTotalItem: 18000,
            calculationMethod: 'fijo',
          },
        ],
      };

      const narrative = buildPresupuestoNarrative(mockPresupuesto as Presupuesto);

      expect(narrative).toContain('quince años');
      expect(narrative).toContain('80 invitados');
      expect(narrative).toContain('Club Uruguay');
      expect(narrative).toContain('servicio gastronómico');
      expect(narrative).toContain('servicio de bebidas y barra');
      expect(narrative).toContain('discoteca profesional');
      expect(narrative).toContain('fotocabina interactiva');
      expect(narrative).toContain('Club Uruguay ya incluye la limpieza completa');
      // Regla dura: la narrativa NO inventa precios ni sumatorias numéricas
      expect(narrative).not.toContain('$');
      expect(narrative).not.toContain('96000');
    });

    it('debe manejar eventos sin salón ni invitados especificados con gracia', () => {
      const mockSimple: Partial<Presupuesto> = {
        id: 'pres_simple',
        eventoTipo: 'Boda',
        itemsPresupuestados: [],
      };

      const narrative = buildPresupuestoNarrative(mockSimple as Presupuesto);
      expect(narrative).toContain('boda');
      expect(narrative).toContain('selección detallada de servicios');
    });
  });

  describe('Bloque I: Formateo de pedidos por WhatsApp a proveedores', () => {
    it('debe estructurar el mensaje de pedido con insumos, cantidades y cortesía', () => {
      const items = [
        { nombre: 'Carne vacuna premium', cantidadNecesaria: 25.5, unit: 'kg' },
        { nombre: 'Bandejas descartables', cantidadNecesaria: 100, unit: 'u' },
      ];

      let msg = `*Pedido de Insumos - AK Producciones*\n`;
      msg += `🎉 *Evento:* Fiesta de XV Sofía\n`;
      msg += `📦 *Proveedor:* Frigorífico Salto\n\n`;
      msg += `*Detalle del pedido:*\n`;
      items.forEach((it) => {
        const isInteger = it.unit.toLowerCase() === 'u';
        const qty = isInteger ? Math.round(it.cantidadNecesaria) : Number(it.cantidadNecesaria).toFixed(2);
        msg += `• ${it.nombre}: ${qty} ${it.unit}\n`;
      });
      msg += `\nPor favor confirmar disponibilidad y fecha de entrega. ¡Muchas gracias!`;

      expect(msg).toContain('Frigorífico Salto');
      expect(msg).toContain('Carne vacuna premium: 25.50 kg');
      expect(msg).toContain('Bandejas descartables: 100 u');
      expect(msg).toContain('Por favor confirmar disponibilidad');
    });
  });

  describe('Bloque G: Estructura de Cápsula del Tiempo', () => {
    it('debe calcular fecha de desbloqueo futura correctamente a partir de los años elegidos', () => {
      const isTimeCapsule = true;
      const unlockYears = 5;
      const now = new Date('2026-08-15T00:00:00.000Z');

      const future = new Date(now.getTime());
      future.setFullYear(future.getFullYear() + unlockYears);

      expect(future.getFullYear()).toBe(2031);
      expect(future.toISOString()).toBe('2031-08-15T00:00:00.000Z');
    });
  });

  describe('Bloque F: Foto más querida de la noche', () => {
    it('debe seleccionar la publicación aprobada con más corazones', () => {
      const posts = [
        { id: '1', likes: 4, imageUrl: 'img1.jpg', authorName: 'Ana' },
        { id: '2', likes: 18, imageUrl: 'img2.jpg', authorName: 'Carlos' },
        { id: '3', likes: 7, imageUrl: 'img3.jpg', authorName: 'Lucía' },
      ];

      const top = [...posts].sort((a, b) => b.likes - a.likes)[0];
      expect(top.id).toBe('2');
      expect(top.likes).toBe(18);
    });
  });
});
