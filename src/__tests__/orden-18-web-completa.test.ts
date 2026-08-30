import fs from 'fs';
import path from 'path';
import { buscarEnElSitio } from '@/lib/buscador/buscar-sitio';
import { suscribirANovedades } from '@/app/actions/novedades-suscripcion';

describe('Orden 18: Lo que le falta a la web para estar completa', () => {
  describe('Bloque 1: Migas de pan visibles', () => {
    it('muestra migas de pan visibles que coinciden con los datos declarados a Google', () => {
      const filePath = path.join(process.cwd(), 'src/app/public/[eventType]/page.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('<BreadcrumbJsonLd');
      expect(content).toContain('aria-label="Migas de pan"');
      expect(content).toContain('href="/"');
      expect(content).toContain('{catalog.name}');
    });
  });

  describe('Bloque 2: Buscador dentro del sitio', () => {
    it('encuentra articulos del blog por titulo o tematica', () => {
      const res = buscarEnElSitio('estres');
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].tipo).toBe('articulo');
      expect(res[0].url).toContain('/blog/');
    });

    it('encuentra catalogos y servicios por tipo de fiesta', () => {
      const res = buscarEnElSitio('quince');
      expect(res.length).toBeGreaterThan(0);
      expect(res.some((r) => r.tipo === 'servicio')).toBe(true);
    });

    it('devuelve array vacio para consultas inexistentes o vacias', () => {
      expect(buscarEnElSitio('')).toEqual([]);
      expect(buscarEnElSitio('xyzabc999invalido')).toEqual([]);
    });

    it('verifica que la pantalla de busqueda publica /buscar este disponible', () => {
      const rutaBuscar = '/buscar';
      const filePath = path.join(process.cwd(), 'src/app' + rutaBuscar + '/page.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('buscarEnElSitio');
      expect(content).toContain('Buscador del Sitio');
    });
  });

  describe('Bloque 4: Pagina de mantenimiento', () => {
    it('posee mensaje claro en criollo y acceso directo a WhatsApp en /mantenimiento', () => {
      const rutaMantenimiento = '/mantenimiento';
      const filePath = path.join(process.cwd(), 'src/app' + rutaMantenimiento + '/page.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('Estamos en mantenimiento');
      expect(content).toContain('wa.me');
      expect(content).toContain('Escribinos por WhatsApp');
    });
  });

  describe('Bloque 5: Suscripcion a novedades', () => {
    it('valida correos invalidos', async () => {
      const res = await suscribirANovedades('correo-sin-arroba');
      expect(res.success).toBe(false);
      expect(res.message).toContain('correo electrónico válido');
    });

    it('acepta suscripciones validas', async () => {
      const res = await suscribirANovedades('invitado.nuevo@ejemplo.com');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Gracias por suscribirte');
    });
  });

  describe('Bloque 6: Compartir articulo del blog', () => {
    it('el componente cuenta con enlaces de WhatsApp, Facebook y Copiar', () => {
      const filePath = path.join(process.cwd(), 'src/components/public/CompartirArticulo.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('api.whatsapp.com/send');
      expect(content).toContain('facebook.com/sharer');
      expect(content).toContain('navigator.clipboard');
    });
  });
});
