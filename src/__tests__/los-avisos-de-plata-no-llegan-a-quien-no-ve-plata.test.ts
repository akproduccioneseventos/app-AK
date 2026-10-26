/** @jest-environment node */
/**
 * Pregunta 102 (26/10/2026, barrido tras Codex en la 1364). Todo aviso interno salía como aviso al
 * teléfono de TODO el equipo con su texto ("Pago de $15.000 registrado para Sofía"), y la lista de
 * avisos se mostraba entera a cualquiera con sesión. Ahora: al teléfono va un texto genérico si el
 * aviso es de plata, y la lista oculta los de plata a quien no tiene permiso de contabilidad.
 * Comprobado rompiéndolo: volviendo a mandar `newNotification.mensaje`, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';
import { esAvisoDePlata, textoParaElTelefono } from '@/lib/notifications/aviso-con-plata';

describe('los avisos de plata no llegan a quien no ve plata', () => {
  it('reconoce los avisos de plata', () => {
    expect(esAvisoDePlata({ mensaje: 'Pago de $15.000 registrado para Sofía' })).toBe(true);
    expect(esAvisoDePlata({ mensaje: 'Saldo pendiente de UYU 20.000 para el evento de Ana' })).toBe(true);
    expect(esAvisoDePlata({ titulo: 'Pago rechazado', mensaje: 'Pago rechazado para Ana. Motivo: x' })).toBe(true);
    expect(esAvisoDePlata({ mensaje: 'Tenés una reunión mañana a las 18' })).toBe(false);
  });

  it('al teléfono no viaja el texto de un aviso de plata', () => {
    expect(textoParaElTelefono({ mensaje: 'Pago de $15.000 registrado para Sofía' })).not.toContain('15.000');
    expect(textoParaElTelefono({ mensaje: 'Tenés una reunión mañana' })).toBe('Tenés una reunión mañana');
  });

  it('la creación de avisos y la lista usan los filtros', () => {
    const texto = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/notifications.ts'), 'utf8');
    expect(texto).not.toContain('body: newNotification.mensaje');
    expect(texto).toContain('body: textoParaElTelefono(newNotification)');
    expect(texto).toMatch(/puede\(session\.user, PERMISOS\.CONTABILIDAD\)[\s\S]{0,120}esAvisoDePlata/);
  });
});
