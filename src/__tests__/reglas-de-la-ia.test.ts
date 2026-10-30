import fs from 'fs';
import path from 'path';
import {
  esTareaProhibidaSola,
  guardarReglaIA,
  getReglasDeLaIA,
  getReglaParaTarea,
  registrarAccionSola,
  getRegistroAccionesSolas,
  registrarDecisionDuenio,
  getResumenMensualAprendizaje,
  TAREAS_PROHIBIDAS_SOLA,
} from '@/lib/ia/reglas-de-la-ia';
import {
  aprenderDeLoAprobado,
  getPlantillasMasElegidas,
} from '@/lib/ia/aprender-de-lo-aprobado';

describe('Reglas de la IA y Aprendizaje (Orden 236)', () => {
  const dataDir = path.join(process.cwd(), 'data');
  const reglasPath = path.join(dataDir, 'reglas-de-la-ia.json');
  const registroPath = path.join(dataDir, 'ia-registro.json');
  const aprendizajePath = path.join(dataDir, 'ia-aprendizaje.json');

  let originalReglas: string | null = null;
  let originalRegistro: string | null = null;
  let originalAprendizaje: string | null = null;
  let originalModoLocal: string | undefined;

  beforeAll(() => {
    originalModoLocal = process.env.AK_USE_LOCAL_JSON_ONLY;
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    if (fs.existsSync(reglasPath)) originalReglas = fs.readFileSync(reglasPath, 'utf8');
    if (fs.existsSync(registroPath)) originalRegistro = fs.readFileSync(registroPath, 'utf8');
    if (fs.existsSync(aprendizajePath)) originalAprendizaje = fs.readFileSync(aprendizajePath, 'utf8');
  });

  afterAll(() => {
    if (originalModoLocal === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = originalModoLocal;
    if (originalReglas !== null) fs.writeFileSync(reglasPath, originalReglas, 'utf8');
    else if (fs.existsSync(reglasPath)) fs.unlinkSync(reglasPath);

    if (originalRegistro !== null) fs.writeFileSync(registroPath, originalRegistro, 'utf8');
    else if (fs.existsSync(registroPath)) fs.unlinkSync(registroPath);

    if (originalAprendizaje !== null) fs.writeFileSync(aprendizajePath, originalAprendizaje, 'utf8');
    else if (fs.existsSync(aprendizajePath)) fs.unlinkSync(aprendizajePath);
  });

  beforeEach(() => {
    if (fs.existsSync(reglasPath)) fs.unlinkSync(reglasPath);
    if (fs.existsSync(registroPath)) fs.unlinkSync(registroPath);
    if (fs.existsSync(aprendizajePath)) fs.unlinkSync(aprendizajePath);
  });

  describe('esTareaProhibidaSola', () => {
    it('detecta tareas prohibidas independientemente de guiones bajos o medios', () => {
      expect(esTareaProhibidaSola('mandar_mensajes_clientes')).toBe(true);
      expect(esTareaProhibidaSola('mandar-mensajes-clientes')).toBe(true);
      expect(esTareaProhibidaSola('MANDAR_MENSAJES')).toBe(true);
      expect(esTareaProhibidaSola('cobrar_marcar_pagado')).toBe(true);
      expect(esTareaProhibidaSola('cerrar_presupuesto')).toBe(true);
      expect(esTareaProhibidaSola('tocar-permisos')).toBe(true);
      expect(esTareaProhibidaSola('gastar_publicidad')).toBe(true);
      expect(esTareaProhibidaSola('vigilante_publicidad')).toBe(true);
    });

    it('permite tareas no prohibidas', () => {
      expect(esTareaProhibidaSola('vigilante_fiestas')).toBe(false);
      expect(esTareaProhibidaSola('generador_contenido')).toBe(false);
      expect(esTareaProhibidaSola('armar_web_evento')).toBe(false);
      expect(esTareaProhibidaSola('errores_humanos')).toBe(false);
    });
  });

  describe('guardarReglaIA y permisos', () => {
    it('no permite pasar a "sola" una tarea prohibida', async () => {
      await expect(guardarReglaIA('mandar_mensajes_clientes', 'sola', 'dueno')).rejects.toThrow(
        'Esta tarea no puede ejecutarse sola por seguridad'
      );
      await expect(guardarReglaIA('vigilante_publicidad', 'sola', 'admin')).rejects.toThrow(
        'Esta tarea no puede ejecutarse sola por seguridad'
      );
    });

    it('no permite guardar si el perfil no es dueno o admin', async () => {
      await expect(guardarReglaIA('vigilante_fiestas', 'sola', 'mozo')).rejects.toThrow(
        'Permisos insuficientes para modificar reglas de IA'
      );
      await expect(guardarReglaIA('vigilante_fiestas', 'sola', 'cliente')).rejects.toThrow(
        'Permisos insuficientes para modificar reglas de IA'
      );
    });

    it('permite guardar a dueno o admin tareas permitidas', async () => {
      const res1 = await guardarReglaIA('vigilante_fiestas', 'apagada', 'dueno');
      expect(res1.success).toBe(true);

      const regla = await getReglaParaTarea('vigilante_fiestas');
      expect(regla).toBe('apagada');

      const res2 = await guardarReglaIA('vigilante_publicidad', 'preguntar', 'admin');
      expect(res2.success).toBe(true);
      expect(await getReglaParaTarea('vigilante_publicidad')).toBe('preguntar');
    });
  });

  describe('getReglasDeLaIA', () => {
    it('devuelve todas las tareas predeterminadas con sus modos por defecto', async () => {
      const reglas = await getReglasDeLaIA();
      expect(reglas.length).toBeGreaterThanOrEqual(14);

      const pub = reglas.find((r) => r.id === 'vigilante_publicidad');
      expect(pub?.modo).toBe('preguntar');
      expect(pub?.prohibidaSola).toBe(true);

      const fiestas = reglas.find((r) => r.id === 'vigilante_fiestas');
      expect(fiestas?.modo).toBe('sola');
    });
  });

  describe('registrarAccionSola y getRegistroAccionesSolas', () => {
    it('guarda acciones con ID y fecha ISO y recupera la lista', async () => {
      const reg = await registrarAccionSola({
        tareaId: 'vigilante_fiestas',
        que: 'Revisó tareas pendientes',
        enlace: '/repaso-diario',
      });

      expect(reg.id).toMatch(/^reg_sola_/);
      expect(reg.tareaId).toBe('vigilante_fiestas');
      expect(reg.que).toBe('Revisó tareas pendientes');
      expect(reg.enlace).toBe('/repaso-diario');
      expect(reg.fecha).toBeDefined();

      const historial = await getRegistroAccionesSolas();
      expect(historial.length).toBe(1);
      expect(historial[0].id).toBe(reg.id);
    });
  });

  describe('registrarDecisionDuenio y autoapagado tras 3 rechazos', () => {
    it('apaga automáticamente la regla y avisa si se rechaza 3 veces consecutivas', async () => {
      await guardarReglaIA('recontacto_automatico', 'preguntar', 'dueno');

      await registrarDecisionDuenio({
        tipoTarea: 'recontacto_automatico',
        decision: 'no',
      });
      expect(await getReglaParaTarea('recontacto_automatico')).toBe('preguntar');

      await registrarDecisionDuenio({
        tipoTarea: 'recontacto_automatico',
        decision: 'no',
      });
      expect(await getReglaParaTarea('recontacto_automatico')).toBe('preguntar');

      await registrarDecisionDuenio({
        tipoTarea: 'recontacto_automatico',
        decision: 'no',
      });

      // Ahora debe haber pasado a 'apagada'
      expect(await getReglaParaTarea('recontacto_automatico')).toBe('apagada');

      // Debe haber registrado el aviso en ia-registro.json
      const registro = await getRegistroAccionesSolas();
      const aviso = registro.find((r) => r.tareaId === 'recontacto_automatico');
      expect(aviso).toBeDefined();
      expect(aviso?.que).toContain('Dejé de proponerte recontacto_automatico porque lo rechazaste 3 veces seguidas');
      expect(aviso?.enlace).toBe('/centro-de-control');
    });
  });

  describe('getResumenMensualAprendizaje', () => {
    it('devuelve mensaje por defecto si no hay datos', async () => {
      const res = await getResumenMensualAprendizaje();
      expect(res).toBe('Este mes aprendí de tus decisiones para afinar textos y propuestas automáticas.');
    });

    it('analiza longitud más corta y plantillas', async () => {
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        textoPropuesto: 'Un texto larguísimo con muchos detalles innecesarios y redundantes',
        textoFinal: 'Un texto corto',
        decision: 'cambiar',
        detalles: { plantilla: 'Grazia' },
      });
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        textoPropuesto: 'Otro texto muy largo para probar la preferencia de brevedad',
        textoFinal: 'Corto',
        decision: 'cambiar',
        detalles: { plantilla: 'Grazia' },
      });

      const resumen = await getResumenMensualAprendizaje();
      expect(resumen).toContain('Este mes aprendí:');
      expect(resumen).toMatch(/más corto|plantilla Grazia/);
    });
  });

  describe('aprenderDeLoAprobado y getPlantillasMasElegidas', () => {
    it('retorna hasta 5 textos aprobados', async () => {
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        textoPropuesto: 'Propuesta 1',
        textoFinal: 'Aprobado 1',
        decision: 'si',
      });
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        textoPropuesto: 'Propuesta 2',
        textoFinal: 'Aprobado 2 corregido',
        decision: 'cambiar',
      });
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        textoPropuesto: 'Rechazado',
        decision: 'no',
      });

      const ejemplos = await aprenderDeLoAprobado('web-evento');
      expect(ejemplos).toHaveLength(2);
      expect(ejemplos).toContain('Aprobado 1');
      expect(ejemplos).toContain('Aprobado 2 corregido');
      expect(ejemplos).not.toContain('Rechazado');
    });

    it('devuelve plantillas ordenadas por frecuencia', async () => {
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        decision: 'si',
        detalles: { plantilla: 'Allegria' },
      });
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        decision: 'si',
        detalles: { plantilla: 'Grazia' },
      });
      await registrarDecisionDuenio({
        tipoTarea: 'web-evento',
        decision: 'si',
        detalles: { plantilla: 'Grazia' },
      });

      const top = await getPlantillasMasElegidas();
      expect(top[0]).toBe('Grazia');
      expect(top[1]).toBe('Allegria');
    });
  });
});
