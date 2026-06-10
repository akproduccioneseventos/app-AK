/**
 * Google Cloud Vision API image moderation integration.
 * Performs direct REST requests to avoid extra npm packages.
 */

import * as logger from '@/lib/logger';

export type SafeSearchLikelihood =
  | 'UNKNOWN'
  | 'VERY_UNLIKELY'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'VERY_LIKELY';

export interface VisionSafeSearchResult {
  adult: SafeSearchLikelihood;
  spoof: SafeSearchLikelihood;
  medical: SafeSearchLikelihood;
  violence: SafeSearchLikelihood;
  racy: SafeSearchLikelihood;
}

export interface ContentSafetyResult {
  safe: boolean;
  reason?: 'inappropriate_content_risk' | 'error' | 'clean';
  categories?: {
    adult: SafeSearchLikelihood;
    violence: SafeSearchLikelihood;
    racy: SafeSearchLikelihood;
  };
}

/**
 * Checks if a base64 image or buffer is safe using Google Cloud Vision Safe Search.
 * Falls back gracefully to true if credentials are not configured or if there is a network issue.
 */
export async function checkImageSafety(
  imageBufferOrBase64: Buffer | string
): Promise<ContentSafetyResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    logger.warn('[ContentSafetyAI] Missing GOOGLE_VISION_API_KEY. Skipping AI image moderation.');
    return { safe: true, reason: 'clean' };
  }

  try {
    let base64Image = '';
    if (Buffer.isBuffer(imageBufferOrBase64)) {
      base64Image = imageBufferOrBase64.toString('base64');
    } else {
      // Remove data URL prefix if present (e.g. "data:image/jpeg;base64,")
      base64Image = imageBufferOrBase64.replace(/^data:image\/\w+;base64,/, '');
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'SAFE_SEARCH_DETECTION',
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[ContentSafetyAI] API returned error response:', response.status, errText);
      return { safe: true, reason: 'error' }; // Graceful fallback
    }

    const data = await response.json();
    const safeSearch: VisionSafeSearchResult | undefined =
      data?.responses?.[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      logger.warn('[ContentSafetyAI] No safeSearchAnnotation in response.');
      return { safe: true, reason: 'clean' };
    }

    // Determine safety: Block if Adult, Violence, or Racy are LIKELY or VERY_LIKELY
    const blockList: SafeSearchLikelihood[] = ['LIKELY', 'VERY_LIKELY'];
    const isAdult = blockList.includes(safeSearch.adult);
    const isViolence = blockList.includes(safeSearch.violence);
    const isRacy = blockList.includes(safeSearch.racy);

    const isUnsafe = isAdult || isViolence || isRacy;

    if (isUnsafe) {
      logger.warn('[ContentSafetyAI] Blocked image upload due to safety concerns:', safeSearch);
      return {
        safe: false,
        reason: 'inappropriate_content_risk',
        categories: {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy,
        },
      };
    }

    return { safe: true, reason: 'clean' };
  } catch (error) {
    logger.error('[ContentSafetyAI] Exception checking image safety:', error);
    return { safe: true, reason: 'error' }; // Graceful fallback
  }
}
