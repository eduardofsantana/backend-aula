import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { hasMatchingImageSignature } from './image-file-validation';

describe('hasMatchingImageSignature', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'product-image-test-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('accepts supported image signatures and rejects mismatched MIME types', async () => {
    const jpegPath = join(directory, 'image.jpg');
    const pngPath = join(directory, 'image.png');
    const webpPath = join(directory, 'image.webp');

    await writeFile(jpegPath, Buffer.from([0xff, 0xd8, 0xff, 0]));
    await writeFile(
      pngPath,
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    await writeFile(webpPath, Buffer.from('RIFF0000WEBP', 'ascii'));

    await expect(
      hasMatchingImageSignature(jpegPath, 'image/jpeg'),
    ).resolves.toBe(true);
    await expect(hasMatchingImageSignature(pngPath, 'image/png')).resolves.toBe(
      true,
    );
    await expect(
      hasMatchingImageSignature(webpPath, 'image/webp'),
    ).resolves.toBe(true);
    await expect(
      hasMatchingImageSignature(jpegPath, 'image/png'),
    ).resolves.toBe(false);
    await expect(
      hasMatchingImageSignature(jpegPath, 'application/pdf'),
    ).resolves.toBe(false);
  });
});
