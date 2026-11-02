import { readFile } from 'fs/promises';

const IMAGE_SIGNATURES: Record<string, (header: Buffer) => boolean> = {
  'image/jpeg': (header) =>
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff,
  'image/png': (header) =>
    header.length >= 8 &&
    header
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (header) =>
    header.length >= 12 &&
    header.toString('ascii', 0, 4) === 'RIFF' &&
    header.toString('ascii', 8, 12) === 'WEBP',
};

export async function hasMatchingImageSignature(
  filePath: string,
  mimeType: string,
): Promise<boolean> {
  const signatureMatches = IMAGE_SIGNATURES[mimeType];
  if (!signatureMatches) {
    return false;
  }

  const file = await readFile(filePath);
  return signatureMatches(file.subarray(0, 12));
}
