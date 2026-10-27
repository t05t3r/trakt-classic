// A complete 1x1 lossless WebP, not a truncated header stub.
const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));
const uint32le = (value: number) =>
  [0, 8, 16, 24].map((shift) => (value >> shift) & 0xff);

const vp8lBitstream = [0x2f, 0x00, 0x00, 0x00, 0x00, 0x88, 0x88, 0xfe, 0x07];
const vp8lChunk = [
  ...ascii('VP8L'),
  ...uint32le(vp8lBitstream.length),
  ...vp8lBitstream,
];
const pad = [0x00];
const webpTag = ascii('WEBP');
const riffBody = [...webpTag, ...vp8lChunk, ...pad];
const riffHeader = [...ascii('RIFF'), ...uint32le(riffBody.length)];

export const OnePixelWebpResponseMock = new Uint8Array([
  ...riffHeader,
  ...riffBody,
]);
