type CleanResult<T = unknown> = {
  value: T;
  changed: boolean;
};

const WINDOWS_1252_SPECIAL_BYTES: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const MOJIBAKE_MARKER_RE = /[\u00c2\u00c3\u00c5\u00c6\u00e2\u0192\u20ac\u2122]/;

function encodeWindows1252(input: string): Uint8Array | null {
  const bytes: number[] = [];

  for (const char of input) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mapped = WINDOWS_1252_SPECIAL_BYTES[codePoint];
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }

  return Uint8Array.from(bytes);
}

function scoreMojibake(input: string): number {
  let score = 0;
  for (const char of input) {
    const codePoint = char.codePointAt(0);
    if (
      codePoint === 0x00c2 ||
      codePoint === 0x00c3 ||
      codePoint === 0x00e2 ||
      codePoint === 0x0192 ||
      codePoint === 0x20ac ||
      codePoint === 0x2122 ||
      codePoint === 0xfffd
    ) {
      score += 2;
    }
  }
  return score;
}

function decodeWindows1252MojibakeOnce(input: string): string | null {
  const bytes = encodeWindows1252(input);
  if (!bytes) return null;

  const decoded = Buffer.from(bytes).toString('utf8');
  if (!decoded || decoded.includes('\ufffd')) return null;
  return decoded;
}

export function cleanMojibakeString(input: string): string {
  if (!MOJIBAKE_MARKER_RE.test(input)) return input;

  let current = input;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const decoded = decodeWindows1252MojibakeOnce(current);
    if (!decoded || decoded === current) break;

    if (scoreMojibake(decoded) <= scoreMojibake(current)) {
      current = decoded;
      if (!MOJIBAKE_MARKER_RE.test(current)) break;
      continue;
    }

    break;
  }

  return current;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function cleanMojibakeValue<T>(value: T): CleanResult<T> {
  if (typeof value === 'string') {
    const cleaned = cleanMojibakeString(value);
    return { value: cleaned as T, changed: cleaned !== value };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const cleanedArray = value.map((item) => {
      const result = cleanMojibakeValue(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: cleanedArray as T, changed };
  }

  if (isPlainObject(value)) {
    let changed = false;
    const cleanedObject: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      const result = cleanMojibakeValue(item);
      if (result.changed) changed = true;
      cleanedObject[key] = result.value;
    }

    return { value: cleanedObject as T, changed };
  }

  return { value, changed: false };
}
