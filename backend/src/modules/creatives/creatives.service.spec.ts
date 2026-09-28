import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { CreativesService } from './creatives.service';

describe('CreativesService.uploadRevision', () => {
  let prisma: any;
  let storageService: any;
  let service: CreativesService;
  let tempFile: string;

  beforeEach(async () => {
    tempFile = join(tmpdir(), `creatives-spec-${Date.now()}`);
    await fs.writeFile(tempFile, 'x');

    prisma = { creative: { findUnique: jest.fn() }, $transaction: jest.fn() };
    storageService = { save: jest.fn() };
    service = new CreativesService(
      prisma,
      { updateCounts: jest.fn() } as any,
      { log: jest.fn() } as any,
      {} as any,
      storageService,
    );
  });

  afterEach(() => fs.rm(tempFile, { force: true }));

  const file = () => ({ path: tempFile, mimetype: 'image/png', originalname: 'v2.png' }) as any;

  it('only accepts revisions for rejected creatives and discards the upload', async () => {
    prisma.creative.findUnique.mockResolvedValue({
      id: 'c1',
      batchId: 'b1',
      currentVersion: 1,
      approval: { status: 'PENDING' },
    });

    await expect(service.uploadRevision('c1', file(), 'u1')).rejects.toThrow(BadRequestException);
    expect(storageService.save).not.toHaveBeenCalled();
    await expect(fs.access(tempFile)).rejects.toThrow();
  });

  it('stores the new version for a rejected creative', async () => {
    prisma.creative.findUnique.mockResolvedValue({
      id: 'c1',
      batchId: 'b1',
      currentVersion: 1,
      approval: { status: 'REJECTED' },
    });
    storageService.save.mockResolvedValue('/uploads/v2.png');

    const tx = {
      approval: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      creativeVersion: { create: jest.fn() },
      creative: { update: jest.fn() },
      internalAdjustmentStatus: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(tx));

    await service.uploadRevision('c1', file(), 'u1');

    expect(tx.creativeVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 2, fileUrl: '/uploads/v2.png' }),
    });
    expect(tx.approval.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { creativeId: 'c1', status: 'REJECTED' },
        data: expect.objectContaining({ status: 'PENDING', reviewedVersion: 2 }),
      }),
    );
  });
});
