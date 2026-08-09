import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

type SocialInteractionRateLimitInput = {
  scope: string;
  fiestaId: string;
  participantIdentity: string;
  participantLimit: number;
  eventLimit: number;
  windowMs: number;
};

export async function enforceSocialInteractionRateLimit(
  input: SocialInteractionRateLimitInput,
): Promise<void> {
  // The first key cannot be changed by the guest. It caps the total traffic for
  // this event and client address even if an attacker rotates names constantly.
  await enforcePublicRateLimit({
    scope: `${input.scope}-event`,
    identity: input.fiestaId,
    limit: input.eventLimit,
    windowMs: input.windowMs,
  });

  // Keep a lower participant limit as a second layer for ordinary repeated use.
  const participant = input.participantIdentity.trim().toLowerCase() || 'invitado';
  await enforcePublicRateLimit({
    scope: input.scope,
    identity: `${input.fiestaId}|${participant}`,
    limit: input.participantLimit,
    windowMs: input.windowMs,
  });
}
