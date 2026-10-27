type Signature = { bytes: ReadonlyArray<number>; type: string };

const SIGNATURES: ReadonlyArray<Signature> = [
  { bytes: [0xff, 0xd8, 0xff], type: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], type: 'image/gif' },
];

type Extension = { pattern: RegExp; type: string };

const EXTENSION_TYPES: ReadonlyArray<Extension> = [
  { pattern: /\.webp$/i, type: 'image/webp' },
  { pattern: /\.png$/i, type: 'image/png' },
  { pattern: /\.jpe?g$/i, type: 'image/jpeg' },
  { pattern: /\.gif$/i, type: 'image/gif' },
];

const DEFAULT_TYPE = 'image/jpeg';

function matchesSignature(bytes: Uint8Array, signature: Signature): boolean {
  return signature.bytes.every((byte, index) => bytes.at(index) === byte);
}

function isWebp(bytes: Uint8Array): boolean {
  const riff = String.fromCharCode(...bytes.subarray(0, 4));
  const webp = String.fromCharCode(...bytes.subarray(8, 12));
  return riff === 'RIFF' && webp === 'WEBP';
}

function extensionType(path: string): string | undefined {
  const match = EXTENSION_TYPES.find(({ pattern }) => pattern.test(path));
  return match?.type;
}

type SniffImageTypeParams = { bytes: Uint8Array; path: string };

export function sniffImageType(
  { bytes, path }: SniffImageTypeParams,
): string {
  const signature = SIGNATURES.find((candidate) =>
    matchesSignature(bytes, candidate)
  );
  if (signature) return signature.type;
  if (isWebp(bytes)) return 'image/webp';

  return extensionType(path) ?? DEFAULT_TYPE;
}
