// Inspect raster headers before asking the browser to allocate decoded pixels.
// The browser still validates and decodes the complete image afterward.
export const MAX_IMAGE_PIXELS = 50_000_000;
export const MAX_IMAGE_SIDE = 16_384;
export const MAX_AVATAR_DATA_URL_LENGTH = 1_600_000;

function dimensions(width, height) {
  if (!width || !height) throw new Error("This image has invalid dimensions.");
  if (
    width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE ||
    width * height > MAX_IMAGE_PIXELS
  ) throw new Error("Choose an image no larger than 50 megapixels or 16,384 pixels per side.");
  return { width, height };
}

export function validateRasterImage(bytes, type) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const text = (start, length) => String.fromCharCode(...b.subarray(start, start + length));
  if (
    type === "image/png" && b.length >= 33 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v) &&
    view.getUint32(8) === 13 && text(12, 4) === "IHDR"
  ) return dimensions(view.getUint32(16), view.getUint32(20));

  if (type === "image/jpeg" && b[0] === 0xff && b[1] === 0xd8) {
    let offset = 2;
    while (offset < b.length) {
      if (b[offset++] !== 0xff) break;
      while (offset < b.length && b[offset] === 0xff) offset++;
      const marker = b[offset++];
      if (marker === 0xda || marker === 0xd9 || marker === 0) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > b.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > b.length) break;
      // Start-of-frame markers, excluding Huffman tables and reserved markers.
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 8) break;
        return dimensions(view.getUint16(offset + 5), view.getUint16(offset + 3));
      }
      offset += length;
    }
  }

  if (
    type === "image/webp" && b.length >= 25 &&
    text(0, 4) === "RIFF" && text(8, 4) === "WEBP" &&
    view.getUint32(4, true) + 8 <= b.length &&
    view.getUint32(16, true) + 20 <= b.length
  ) {
    const chunk = text(12, 4);
    const chunkLength = view.getUint32(16, true);
    if (chunk === "VP8X" && chunkLength === 10 && b.length >= 30) {
      const uint24 = (offset) => b[offset] | (b[offset + 1] << 8) | (b[offset + 2] << 16);
      return dimensions(1 + uint24(24), 1 + uint24(27));
    }
    if (chunk === "VP8L" && chunkLength >= 5 && b[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return dimensions(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
    }
    if (
      chunk === "VP8 " && chunkLength >= 10 && b.length >= 30 &&
      !(b[20] & 1) && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a
    ) return dimensions(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
  }
  throw new Error("Choose a valid PNG, JPEG, or WebP image that matches its file type.");
}

export function isSafeAvatarDataURL(value) {
  if (typeof value !== "string" || value.length >= MAX_AVATAR_DATA_URL_LENGTH) return false;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  try {
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    validateRasterImage(bytes, match[1]);
    return true;
  } catch {
    return false;
  }
}
