/**
 * Tests for the date-parser and intent-router utilities.
 */

import { parseDateTimeUY } from '@/lib/assistant/date-parser';
import { detectIntent } from '@/lib/assistant/intent-router';

// Fixed reference date: Wednesday 2026-04-15 (miércoles)
const REF = new Date('2026-04-15T12:00:00.000Z');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Date parser
// ─────────────────────────────────────────────────────────────────────────────

describe('parseDateTimeUY — relative days', () => {
  it('parses "hoy"', () => {
    const { date } = parseDateTimeUY('hoy', REF);
    expect(date).toBe('2026-04-15');
  });

  it('parses "mañana"', () => {
    const { date } = parseDateTimeUY('mañana', REF);
    expect(date).toBe('2026-04-16');
  });

  it('parses "pasado mañana"', () => {
    const { date } = parseDateTimeUY('pasado mañana', REF);
    expect(date).toBe('2026-04-17');
  });

  it('parses "manana" (without accent)', () => {
    const { date } = parseDateTimeUY('manana', REF);
    expect(date).toBe('2026-04-16');
  });
});

describe('parseDateTimeUY — days of week', () => {
  it('parses "viernes" (next Friday from Wednesday)', () => {
    const { date } = parseDateTimeUY('viernes', REF);
    expect(date).toBe('2026-04-17');
  });

  it('parses "lunes" (next Monday)', () => {
    const { date } = parseDateTimeUY('lunes', REF);
    expect(date).toBe('2026-04-20');
  });

  it('parses "miércoles" (next Wednesday — 7 days ahead)', () => {
    const { date } = parseDateTimeUY('miércoles', REF);
    expect(date).toBe('2026-04-22');
  });
});

describe('parseDateTimeUY — explicit dates', () => {
  it('parses "12/5"', () => {
    const { date } = parseDateTimeUY('12/5', REF);
    expect(date).toBe('2026-05-12');
  });

  it('parses "12 de mayo"', () => {
    const { date } = parseDateTimeUY('12 de mayo', REF);
    expect(date).toBe('2026-05-12');
  });

  it('parses "el 3 de junio de 2027"', () => {
    const { date } = parseDateTimeUY('el 3 de junio de 2027', REF);
    expect(date).toBe('2027-06-03');
  });

  it('parses "3/6/2027"', () => {
    const { date } = parseDateTimeUY('3/6/2027', REF);
    expect(date).toBe('2027-06-03');
  });
});

describe('parseDateTimeUY — times', () => {
  it('parses "a las 11"', () => {
    const { time } = parseDateTimeUY('a las 11', REF);
    expect(time).toBe('11:00');
  });

  it('parses "15 hs"', () => {
    const { time } = parseDateTimeUY('15 hs', REF);
    expect(time).toBe('15:00');
  });

  it('parses "3 de la tarde"', () => {
    const { time } = parseDateTimeUY('3 de la tarde', REF);
    expect(time).toBe('15:00');
  });

  it('parses "11:30"', () => {
    const { time } = parseDateTimeUY('mañana a las 11:30', REF);
    expect(time).toBe('11:30');
  });

  it('parses "a las 15:30"', () => {
    const { time } = parseDateTimeUY('a las 15:30', REF);
    expect(time).toBe('15:30');
  });
});

describe('parseDateTimeUY — combined date and time', () => {
  it('parses "mañana a las 15"', () => {
    const { date, time } = parseDateTimeUY('mañana a las 15', REF);
    expect(date).toBe('2026-04-16');
    expect(time).toBe('15:00');
  });

  it('parses "el viernes a las 11"', () => {
    const { date, time } = parseDateTimeUY('el viernes a las 11', REF);
    expect(date).toBe('2026-04-17');
    expect(time).toBe('11:00');
  });

  it('returns empty object for unrecognized input', () => {
    const result = parseDateTimeUY('cualquier cosa sin fecha', REF);
    expect(result.date).toBeUndefined();
    expect(result.time).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Intent router
// ─────────────────────────────────────────────────────────────────────────────

describe('detectIntent — schedule_meeting', () => {
  it('detects "Agendame una cita con Norma mañana a las 15"', () => {
    const intent = detectIntent('Agendame una cita con Norma mañana a las 15', REF);
    expect(intent.type).toBe('schedule_meeting');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('Norma');
    expect(intent.data.time).toBe('15:00');
  });

  it('detects "Agenda a Norma a las 11"', () => {
    const intent = detectIntent('Agenda a Norma a las 11', REF);
    expect(intent.type).toBe('schedule_meeting');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('Norma');
    expect(intent.data.notes).toContain('11');
  });

  it('detects "Agendar a María a las 10"', () => {
    const intent = detectIntent('Agendar a María a las 10', REF);
    expect(intent.type).toBe('schedule_meeting');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('María');
  });

  it('detects "Agenda a Norma mañana"', () => {
    const intent = detectIntent('Agenda a Norma mañana', REF);
    expect(intent.type).toBe('schedule_meeting');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('Norma');
    expect(intent.data.followUpDate).toBe('2026-04-16');
  });

  it('returns none when only name is detected (no date/time) — passes to Gemini for multi-turn', () => {
    const intent = detectIntent('Agenda con Laura', REF);
    expect(intent.type).toBe('none');
  });

  it('returns none for non-scheduling messages', () => {
    expect(detectIntent('Hola', REF).type).toBe('none');
    expect(detectIntent('NORMA', REF).type).toBe('none');
  });

  it('returns none when name cannot be extracted', () => {
    const intent = detectIntent('Agendame una reunión', REF);
    // No name given → cannot schedule
    expect(intent.type).toBe('none');
  });
});
