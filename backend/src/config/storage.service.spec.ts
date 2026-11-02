import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

import { put as blobPut, del as blobDel } from '@vercel/blob';
import { StorageService } from './storage.service';

const configWith = (values: Record<string, string | undefined>) =>
  ({ get: (key: string) => values[key] }) as any;

describe('StorageService', () => {
  let cloudinary: any;
  let tempFile: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    cloudinary = { uploadFile: jest.fn(), deleteFile: jest.fn() };
    tempFile = join(tmpdir(), `storage-spec-${Date.now()}-${Math.random()}`);
    await fs.writeFile(tempFile, 'x');
  });

  afterEach(() => fs.rm(tempFile, { force: true }));

  const upload = (overrides: Partial<Express.Multer.File> = {}) =>
    ({ path: tempFile, mimetype: 'image/png', originalname: 'arte.png', ...overrides }) as Express.Multer.File;

  it('prefers Cloudinary, then Vercel Blob, then the local disk', () => {
    expect(new StorageService(configWith({ CLOUDINARY_CLOUD_NAME: 'c', BLOB_READ_WRITE_TOKEN: 't' }), cloudinary).provider).toBe('cloudinary');
    expect(new StorageService(configWith({ BLOB_READ_WRITE_TOKEN: 't' }), cloudinary).provider).toBe('vercel-blob');
    expect(new StorageService(configWith({}), cloudinary).provider).toBe('local');
  });

  it('uploads to Vercel Blob with a safe name and removes the temp file', async () => {
    (blobPut as jest.Mock).mockResolvedValue({ url: 'https://x.public.blob.vercel-storage.com/creatives/a.png' });
    const service = new StorageService(configWith({ BLOB_READ_WRITE_TOKEN: 'tok' }), cloudinary);

    const url = await service.save(upload({ originalname: 'evil.html', mimetype: 'image/png' }));

    expect(url).toBe('https://x.public.blob.vercel-storage.com/creatives/a.png');
    const [pathname, , options] = (blobPut as jest.Mock).mock.calls[0];
    expect(pathname).toMatch(/^creatives\/[0-9a-f-]{36}\.png$/);
    expect(options).toMatchObject({ access: 'public', contentType: 'image/png', token: 'tok' });
    await expect(fs.access(tempFile)).rejects.toThrow();
  });

  it('deletes blobs, Cloudinary assets and local files according to the URL', async () => {
    const service = new StorageService(configWith({ BLOB_READ_WRITE_TOKEN: 'tok', UPLOAD_DIR: tmpdir() }), cloudinary);

    await service.remove('https://x.public.blob.vercel-storage.com/creatives/a.png');
    expect(blobDel).toHaveBeenCalledWith('https://x.public.blob.vercel-storage.com/creatives/a.png', { token: 'tok' });

    await service.remove('https://res.cloudinary.com/demo/image/upload/v1/ad-review/a.png');
    expect(cloudinary.deleteFile).toHaveBeenCalled();

    const local = join(tmpdir(), 'storage-spec-local.png');
    await fs.writeFile(local, 'x');
    await service.remove('/uploads/../storage-spec-local.png');
    await expect(fs.access(local)).rejects.toThrow();
  });

  it('never throws from remove when the provider fails', async () => {
    (blobDel as jest.Mock).mockRejectedValue(new Error('network'));
    const service = new StorageService(configWith({ BLOB_READ_WRITE_TOKEN: 'tok' }), cloudinary);

    await expect(service.remove('https://x.public.blob.vercel-storage.com/creatives/a.png')).resolves.toBeUndefined();
  });
});
