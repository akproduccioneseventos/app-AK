/**
 * Orden 73 — Bloque 6: Las reuniones no pisan lo del equipo
 *
 * Se probó rompiéndola a propósito:
 * - Si dos tareas con el mismo texto pero distinto responsable se descartaban como duplicadas, la prueba fallaba en rojo.
 * - Si las preguntas frecuentes del portal se activaban forzadamente en visible: true a pesar de estar ocultas, la prueba fallaba en rojo.
 * - Si la liberación del micrófono no se ejecutaba en un bloque finally, la prueba fallaba en rojo.
 */

import fs from 'fs';
import path from 'path';

describe('Orden 73 Bloque 6: Las reuniones no pisan lo del equipo', () => {
  const actionsPath = path.join(process.cwd(), 'src/app/actions/meeting-intelligence.ts');
  const recorderPath = path.join(process.cwd(), 'src/components/reuniones/MeetingIntelligenceRecorder.tsx');

  const actionsContent = fs.readFileSync(actionsPath, 'utf8');
  const recorderContent = fs.readFileSync(recorderPath, 'utf8');

  test('tareas con el mismo texto pero distinto responsable no son consideradas duplicadas', () => {
    // La clave de deduplicación debe incluir el responsable (asignadaA)
    expect(actionsContent).toContain('asignadaA');
    expect(actionsContent).toMatch(/normalizeKey\(\w+\.texto\)}__\${normalizeKey\(\w+\.asignadaA/);
  });

  test('las preguntas frecuentes ocultas permanecen ocultas y no se fuerzan a visible: true', () => {
    // No debe tener "visible: true" incondicional en el objeto faq de clientPortalSettings
    expect(actionsContent).not.toMatch(/faq:\s*\{[\s\S]*?visible:\s*true\s*,[\s\S]*?\}\s*:\s*fiesta\.clientPortalSettings/);
    expect(actionsContent).toContain('visible: fiesta.clientPortalSettings.faq?.visible ?? false');
  });

  test('el micrófono y las pistas de audio se liberan siempre en bloques finally', () => {
    // Tanto en stopRecording como en stopSpeechRecognition se debe usar finally
    expect(recorderContent).toContain('streamRef.current.getTracks().forEach');
    expect(recorderContent).toMatch(/finally\s*\{[\s\S]*?streamRef\.current\s*=\s*null/);
    expect(recorderContent).toMatch(/finally\s*\{[\s\S]*?recognitionRef\.current\s*=\s*null/);
  });

  test('utiliza buildLearningFaqs en meeting-intelligence.ts', () => {
    expect(actionsContent).toContain('buildLearningFaqs');
  });
});
