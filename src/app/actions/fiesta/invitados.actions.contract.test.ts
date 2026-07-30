import fs from 'node:fs';
import path from 'node:path';

const actionSource = fs.readFileSync(
  path.join(process.cwd(), 'src/app/actions/fiesta/invitados.actions.ts'),
  'utf8',
);

describe('guest CTA tracking contract', () => {
  it('validates guest access before using the public write path', () => {
    const trackingStart = actionSource.indexOf('export async function trackGuestCtaClick');
    const trackingSource = actionSource.slice(trackingStart);

    expect(trackingStart).toBeGreaterThan(-1);
    expect(trackingSource).toContain(
      'hasPublicGuestAccess(currentGuest, guestId, guestAccessToken)',
    );
    expect(trackingSource).toContain('}, { publicRsvp: true });');
  });
});
