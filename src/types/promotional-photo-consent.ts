export interface PromotionalPhotoConsentVersion {
  eventId: string;
  authorized: boolean;
  grantedBy: 'owner' | 'client';
  method: 'contract' | 'written' | 'recorded' | 'client_portal';
  evidenceReference: string;
  contractVersion: string;
  recordedBy: string;
  recordedAt: string;
  revokedAt?: string;
}

export interface PromotionalPhotoConsent extends PromotionalPhotoConsentVersion {
  history?: PromotionalPhotoConsentVersion[];
}
