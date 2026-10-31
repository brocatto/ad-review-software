import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreativesService, decodeFilename } from './creatives.service';

describe('CreativesService', () => {
  let prisma: any;
  let batchesService: any;
  let activityLogService: any;
  let storageService: any;
  let service: CreativesService;

  const file = () => ({ path: '/tmp/upload-1', mimetype: 'image/png', originalname: 'v2.png' }) as any;

  const rejectedCreative = {
    id: 'c1',
    name: 'Banner',
    batchId: 'b1',
    currentVersion: 1,
    approval: { status: 'REJECTED' },
    versions: [{ fileUrl: '/uploads/v1.png' }],
  };

  beforeEach(() => {
    prisma = {
      creative: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };
    batchesService = {
      verifyOwnership: jest.fn().mockResolvedValue(true),
      updateCounts: jest.fn(),
      findOne: jest.fn(),
    };
    activityLogService = { log: jest.fn() };
    storageService = { save: jest.fn(), discard: jest.fn(), remove: jest.fn() };
    service = new CreativesService(
      prisma,
      batchesService,
      activityLogService,
      { notifyBatchSent: jest.fn() } as any,
      storageService,
    );
  });

  describe('decodeFilename', () => {
    it('recovers UTF-8 names that multer decoded as latin1', () => {
      expect(decodeFilename('CriaÃ§Ã£o.png')).toBe('Criação.png');
    });

    it('leaves ASCII and already-correct names untouched', () => {
      expect(decodeFilename('banner.png')).toBe('banner.png');
      expect(decodeFilename('Criação.png')).toBe('Criação.png');
    });
  });

  describe('create', () => {
    it('discards the temp files when the batch is not owned by the user', async () => {
      batchesService.findOne.mockRejectedValue(new ForbiddenException());
      const files = [file(), file()];

      await expect(service.create('b1', files, 'intruder')).rejects.toThrow(ForbiddenException);

      expect(storageService.discard).toHaveBeenCalledWith(files);
      expect(storageService.save).not.toHaveBeenCalled();
      expect(prisma.creative.create).not.toHaveBeenCalled();
    });
  });

  describe('uploadRevision', () => {
    it('only accepts revisions for rejected creatives and discards the upload', async () => {
      prisma.creative.findUnique.mockResolvedValue({ ...rejectedCreative, approval: { status: 'PENDING' } });
      const upload = file();

      await expect(service.uploadRevision('c1', upload, 'u1')).rejects.toThrow(BadRequestException);

      expect(storageService.save).not.toHaveBeenCalled();
      expect(storageService.discard).toHaveBeenCalledWith([upload]);
    });

    it('refuses revisions from a user who does not own the batch', async () => {
      prisma.creative.findUnique.mockResolvedValue(rejectedCreative);
      batchesService.verifyOwnership.mockResolvedValue(false);
      const upload = file();

      await expect(service.uploadRevision('c1', upload, 'intruder')).rejects.toThrow(ForbiddenException);

      expect(storageService.discard).toHaveBeenCalledWith([upload]);
    });

    it('stores the new version for a rejected creative', async () => {
      prisma.creative.findUnique.mockResolvedValue(rejectedCreative);
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
      expect(tx.internalAdjustmentStatus.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'RESENT' }) }),
      );
      expect(batchesService.updateCounts).toHaveBeenCalledWith('b1');
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REVISION_UPLOADED', details: { version: 2 } }),
      );
    });

    it('removes the stored file when the transaction fails', async () => {
      prisma.creative.findUnique.mockResolvedValue(rejectedCreative);
      storageService.save.mockResolvedValue('/uploads/v2.png');
      prisma.$transaction.mockRejectedValue(new Error('db down'));

      await expect(service.uploadRevision('c1', file(), 'u1')).rejects.toThrow('db down');

      expect(storageService.remove).toHaveBeenCalledWith('/uploads/v2.png');
      expect(batchesService.updateCounts).not.toHaveBeenCalled();
    });
  });

  describe('updateName', () => {
    it('renames the creative and logs the change', async () => {
      prisma.creative.findUnique.mockResolvedValue(rejectedCreative);
      prisma.creative.update.mockResolvedValue({ ...rejectedCreative, name: 'Banner v2' });

      await service.updateName('c1', 'Banner v2', 'u1');

      expect(prisma.creative.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'Banner v2' } });
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATIVE_RENAMED', details: { from: 'Banner', to: 'Banner v2' } }),
      );
    });

    it('is a no-op when the name did not change', async () => {
      prisma.creative.findUnique.mockResolvedValue(rejectedCreative);

      await service.updateName('c1', 'Banner', 'u1');

      expect(prisma.creative.update).not.toHaveBeenCalled();
      expect(activityLogService.log).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the creative, its stored files and logs the deletion', async () => {
      prisma.creative.findUnique.mockResolvedValue({
        ...rejectedCreative,
        versions: [{ fileUrl: '/uploads/v2.png' }, { fileUrl: '/uploads/v1.png' }],
      });

      await service.remove('c1', 'u1');

      expect(prisma.creative.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(storageService.remove).toHaveBeenCalledTimes(2);
      expect(batchesService.updateCounts).toHaveBeenCalledWith('b1');
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATIVE_DELETED', details: { creativeName: 'Banner' } }),
      );
    });
  });
});
