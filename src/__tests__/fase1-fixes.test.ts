/**
 * FASE 1 – Tests de correcciones arquitectónicas AK Producciones
 *
 * Cubre:
 * 1. Tipografía: las funciones helper devuelven clases Tailwind reales
 * 2. Secciones: se ocultan si visible:false, se ordenan por order
 * 3. Defaults de tipografía y secciones en invitacion-config-defaults
 * 4. CrmTimelineEventType incluye los nuevos tipos contract_signed / deposit_registered / event_created
 * 5. Tipos de fiesta: SocialGalleryBrand tiene todos los campos
 */

import {
  getHeroTitleClass,
  getSectionTitleClass,
  getBodyTextClass,
  getButtonTextClass,
  getSectionSpacingClass,
  isSectionVisible,
  getSectionOrder,
} from '@/app/invitacion/[fiestaId]/invitacion-publica-client';
import {
  DEFAULT_TYPOGRAPHY_CONFIG,
  DEFAULT_SECTIONS_CONFIG,
  defaultInvitacionConfig,
} from '@/lib/invitacion-config-defaults';
import type { InvitacionTypographyConfig, InvitacionSectionConfig, InvitacionSectionId, SocialGalleryBrand } from '@/types/fiesta';
import type { CrmTimelineEventType } from '@/types/crm';

// ─────────────────────────────────────────────────────────────────────────────
// Typography helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('getHeroTitleClass', () => {
  it('returns default classes when no typography config provided', () => {
    const cls = getHeroTitleClass(undefined);
    expect(cls).toContain('text-4xl');
    expect(cls).toContain('lg:text-8xl');
  });

  it('uses custom mobile class when provided', () => {
    const typography: InvitacionTypographyConfig = { heroTitleMobile: 'text-5xl sm:text-7xl' };
    const cls = getHeroTitleClass(typography);
    expect(cls).toContain('text-5xl sm:text-7xl');
  });

  it('uses custom desktop class when provided', () => {
    const typography: InvitacionTypographyConfig = { heroTitleDesktop: 'lg:text-9xl' };
    const cls = getHeroTitleClass(typography);
    expect(cls).toContain('lg:text-9xl');
  });

  it('combines mobile and desktop classes', () => {
    const typography: InvitacionTypographyConfig = {
      heroTitleMobile: 'text-3xl sm:text-5xl',
      heroTitleDesktop: 'lg:text-6xl',
    };
    const cls = getHeroTitleClass(typography);
    expect(cls).toContain('text-3xl sm:text-5xl');
    expect(cls).toContain('lg:text-6xl');
  });
});

describe('getSectionTitleClass', () => {
  it('returns default class when no config', () => {
    expect(getSectionTitleClass(undefined)).toContain('text-2xl');
  });

  it('returns custom class when configured', () => {
    const typography: InvitacionTypographyConfig = { sectionTitle: 'text-3xl sm:text-4xl' };
    expect(getSectionTitleClass(typography)).toBe('text-3xl sm:text-4xl');
  });
});

describe('getBodyTextClass', () => {
  it('returns default text-base when no config', () => {
    expect(getBodyTextClass(undefined)).toBe('text-base');
  });

  it('uses custom body class', () => {
    expect(getBodyTextClass({ body: 'text-lg' })).toBe('text-lg');
  });
});

describe('getButtonTextClass', () => {
  it('returns default text-sm when no config', () => {
    expect(getButtonTextClass(undefined)).toBe('text-sm');
  });

  it('uses custom button class', () => {
    expect(getButtonTextClass({ button: 'text-base' })).toBe('text-base');
  });
});

describe('getSectionSpacingClass', () => {
  it('returns py-16 for normal spacing', () => {
    expect(getSectionSpacingClass({ spacing: 'normal' })).toBe('py-16');
    expect(getSectionSpacingClass(undefined)).toBe('py-16');
  });

  it('returns py-8 for compact', () => {
    expect(getSectionSpacingClass({ spacing: 'compact' })).toBe('py-8');
  });

  it('returns py-20 for spacious', () => {
    expect(getSectionSpacingClass({ spacing: 'spacious' })).toBe('py-20');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section visibility and ordering
// ─────────────────────────────────────────────────────────────────────────────

describe('isSectionVisible', () => {
  it('returns true when no sectionsConfig provided', () => {
    expect(isSectionVisible('bienvenida', undefined)).toBe(true);
    expect(isSectionVisible('rsvp', [])).toBe(true);
  });

  it('returns false when section is marked invisible', () => {
    const config: InvitacionSectionConfig[] = [
      { id: 'bienvenida', visible: false, order: 2 },
    ];
    expect(isSectionVisible('bienvenida', config)).toBe(false);
  });

  it('returns true for section not present in config', () => {
    const config: InvitacionSectionConfig[] = [
      { id: 'rsvp', visible: true, order: 9 },
    ];
    expect(isSectionVisible('galeria', config)).toBe(true);
  });

  it('returns true when section is explicitly visible', () => {
    const config: InvitacionSectionConfig[] = [
      { id: 'cronograma', visible: true, order: 4 },
    ];
    expect(isSectionVisible('cronograma', config)).toBe(true);
  });
});

describe('getSectionOrder', () => {
  it('returns default order when no config', () => {
    expect(getSectionOrder('hero', undefined)).toBe(1);
    expect(getSectionOrder('rsvp', undefined)).toBe(9);
    expect(getSectionOrder('muroSocial', undefined)).toBe(10);
  });

  it('returns custom order from config', () => {
    const config: InvitacionSectionConfig[] = [
      { id: 'rsvp', visible: true, order: 3 },
    ];
    expect(getSectionOrder('rsvp', config)).toBe(3);
  });

  it('returns default order for section not in config', () => {
    const config: InvitacionSectionConfig[] = [
      { id: 'rsvp', visible: true, order: 3 },
    ];
    expect(getSectionOrder('galeria', config)).toBe(7);
  });
});

describe('sections are sorted correctly', () => {
  it('sections sort ascending by order value', () => {
    const sections: InvitacionSectionConfig[] = [
      { id: 'rsvp', visible: true, order: 9 },
      { id: 'bienvenida', visible: true, order: 2 },
      { id: 'galeria', visible: true, order: 7 },
    ];
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe('bienvenida');
    expect(sorted[1].id).toBe('galeria');
    expect(sorted[2].id).toBe('rsvp');
  });

  it('visible:false sections are excluded when filtering', () => {
    const sections: InvitacionSectionConfig[] = [
      { id: 'bienvenida', visible: true, order: 2 },
      { id: 'galeria', visible: false, order: 7 },
      { id: 'rsvp', visible: true, order: 9 },
    ];
    const visible = sections.filter(s => isSectionVisible(s.id as InvitacionSectionId, sections));
    expect(visible).toHaveLength(2);
    expect(visible.find(s => s.id === 'galeria')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Default config in invitacion-config-defaults
// ─────────────────────────────────────────────────────────────────────────────

describe('DEFAULT_TYPOGRAPHY_CONFIG', () => {
  it('has all required fields', () => {
    expect(DEFAULT_TYPOGRAPHY_CONFIG.heroTitleMobile).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.heroTitleDesktop).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.sectionTitle).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.body).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.button).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.lineHeight).toBeTruthy();
    expect(DEFAULT_TYPOGRAPHY_CONFIG.spacing).toBeTruthy();
  });

  it('defaults produce valid Tailwind classes', () => {
    expect(DEFAULT_TYPOGRAPHY_CONFIG.heroTitleMobile).toMatch(/^text-/);
    expect(DEFAULT_TYPOGRAPHY_CONFIG.body).toMatch(/^text-/);
    expect(DEFAULT_TYPOGRAPHY_CONFIG.lineHeight).toMatch(/^leading-/);
  });
});

describe('DEFAULT_SECTIONS_CONFIG', () => {
  it('includes all expected section IDs', () => {
    const ids = DEFAULT_SECTIONS_CONFIG.map(s => s.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('bienvenida');
    expect(ids).toContain('contador');
    expect(ids).toContain('cronograma');
    expect(ids).toContain('ubicacion');
    expect(ids).toContain('dressCode');
    expect(ids).toContain('galeria');
    expect(ids).toContain('regalos');
    expect(ids).toContain('rsvp');
    expect(ids).toContain('muroSocial');
  });

  it('all sections default to visible:true', () => {
    const allVisible = DEFAULT_SECTIONS_CONFIG.every(s => s.visible === true);
    expect(allVisible).toBe(true);
  });

  it('sections have sequential order values', () => {
    const sorted = [...DEFAULT_SECTIONS_CONFIG].sort((a, b) => a.order - b.order);
    sorted.forEach((s, i) => {
      expect(s.order).toBe(i + 1);
    });
  });
});

describe('defaultInvitacionConfig includes typography and sectionsConfig', () => {
  it('has typography field', () => {
    expect(defaultInvitacionConfig.typography).toBeDefined();
    expect(defaultInvitacionConfig.typography?.heroTitleMobile).toBeTruthy();
  });

  it('has sectionsConfig field', () => {
    expect(defaultInvitacionConfig.sectionsConfig).toBeDefined();
    expect(Array.isArray(defaultInvitacionConfig.sectionsConfig)).toBe(true);
    expect((defaultInvitacionConfig.sectionsConfig ?? []).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRM timeline event types
// ─────────────────────────────────────────────────────────────────────────────

describe('CrmTimelineEventType includes FASE 1 types', () => {
  it('accepts contract_signed as a valid event type', () => {
    const eventType: CrmTimelineEventType = 'contract_signed';
    expect(eventType).toBe('contract_signed');
  });

  it('accepts deposit_registered as a valid event type', () => {
    const eventType: CrmTimelineEventType = 'deposit_registered';
    expect(eventType).toBe('deposit_registered');
  });

  it('accepts event_created as a valid event type', () => {
    const eventType: CrmTimelineEventType = 'event_created';
    expect(eventType).toBe('event_created');
  });

  it('existing types still work', () => {
    const existing: CrmTimelineEventType[] = ['stage_change', 'note_added', 'contract_uploaded', 'lead_created'];
    existing.forEach(t => expect(typeof t).toBe('string'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SocialGalleryBrand type structure
// ─────────────────────────────────────────────────────────────────────────────

describe('SocialGalleryBrand fields', () => {
  it('accepts an object with all brand fields', () => {
    const brand: SocialGalleryBrand = {
      logoUrl: 'https://example.com/logo.png',
      companyName: 'AK Producciones',
      instagramHandle: '@ak',
      facebookHandle: 'akprod',
      tiktokHandle: '@ak',
      whatsappNumber: '59899000000',
      landingUrl: 'https://akproducciones.uy',
      ctaText: 'Pedí tu presupuesto',
    };
    expect(brand.companyName).toBe('AK Producciones');
    expect(brand.logoUrl).toContain('example.com');
  });

  it('allows partial brand object (all fields optional)', () => {
    const brand: SocialGalleryBrand = {};
    expect(brand.companyName).toBeUndefined();
  });
});
