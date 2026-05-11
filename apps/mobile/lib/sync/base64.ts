const TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encodeBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      TABLE[(n >> 18) & 63] +
      TABLE[(n >> 12) & 63] +
      TABLE[(n >> 6) & 63] +
      TABLE[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += TABLE[(n >> 18) & 63] + TABLE[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out +=
      TABLE[(n >> 18) & 63] +
      TABLE[(n >> 12) & 63] +
      TABLE[(n >> 6) & 63] +
      '=';
  }
  return out;
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      URL_TABLE[(n >> 18) & 63] +
      URL_TABLE[(n >> 12) & 63] +
      URL_TABLE[(n >> 6) & 63] +
      URL_TABLE[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += URL_TABLE[(n >> 18) & 63] + URL_TABLE[(n >> 12) & 63];
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out +=
      URL_TABLE[(n >> 18) & 63] +
      URL_TABLE[(n >> 12) & 63] +
      URL_TABLE[(n >> 6) & 63];
  }
  return out;
}

function buildReverseLookup(): Uint8Array {
  const map = new Uint8Array(128);
  map.fill(255);
  for (let i = 0; i < TABLE.length; i++) map[TABLE.charCodeAt(i)] = i;
  for (let i = 0; i < URL_TABLE.length; i++) map[URL_TABLE.charCodeAt(i)] = i;
  return map;
}

const REVERSE = buildReverseLookup();

export function decodeBase64(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/, '');
  const len = cleaned.length;
  const outLen = Math.floor((len * 6) / 8);
  const out = new Uint8Array(outLen);
  let buffer = 0;
  let bits = 0;
  let oi = 0;
  for (let i = 0; i < len; i++) {
    const code = cleaned.charCodeAt(i);
    const v = code < 128 ? REVERSE[code] : 255;
    if (v === 255) throw new Error('Invalid base64 character');
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[oi++] = (buffer >> bits) & 0xff;
    }
  }
  return out;
}

export function utf8ToBytes(input: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined')
    return new TextEncoder().encode(input);
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let c = input.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0xd800 || c >= 0xe000)
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined')
    return new TextDecoder().decode(bytes);
  let s = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    if (b < 0x80) s += String.fromCharCode(b);
    else if (b < 0xe0)
      s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else if (b < 0xf0)
      s += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)
      );
    else {
      const cp =
        ((b & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const off = cp - 0x10000;
      s += String.fromCharCode(0xd800 | (off >> 10), 0xdc00 | (off & 0x3ff));
    }
  }
  return s;
}
