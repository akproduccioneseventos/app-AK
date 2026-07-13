import 'server-only';

import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function getExternalWebhookUrl(request: NextRequest) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) url.host = forwardedHost.split(',')[0].trim();
  if (forwardedProto) url.protocol = `${forwardedProto.split(',')[0].trim()}:`;
  return url.toString();
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string
) {
  if (!signature || !appSecret) return false;
  const expected = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`;
  return signaturesMatch(signature, expected);
}

export function verifyTwilioWebhookSignature(input: {
  authToken: string;
  signature: string | null;
  url: string;
  params: URLSearchParams;
}) {
  if (!input.authToken || !input.signature) return false;
  const keys = Array.from(new Set(input.params.keys())).sort();
  const payload = keys.reduce((current, key) => {
    const values = input.params.getAll(key);
    return values.reduce((valuePayload, value) => `${valuePayload}${key}${value}`, current);
  }, input.url);
  const expected = crypto
    .createHmac('sha1', input.authToken)
    .update(payload)
    .digest('base64');
  return signaturesMatch(input.signature, expected);
}
