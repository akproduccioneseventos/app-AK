import type { ElementoDecorativo } from '@/types/fiesta';

export interface DecorationSource { id: string; url: string; title: string }
export interface DecorationDraft {
  id: string;
  source: DecorationSource;
  status: 'queued' | 'analyzing' | 'review' | 'approved' | 'dismissed' | 'error';
  elementos: ElementoDecorativo[];
  unknowns: string[];
  revision: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  contentHash?: string;
  analysisToken?: string;
  approvedName?: string;
  aprobadaSola?: boolean;
  sacada?: boolean;
}
export interface DraftList { drafts: DecorationDraft[]; pending: number; automatic: boolean }
