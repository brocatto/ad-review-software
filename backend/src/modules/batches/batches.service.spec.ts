import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BatchesService } from './batches.service';

describe('BatchesService', () => {
  let service: BatchesService;
  let prisma: any;
  let clientsService: any;
  let notificationsService: any;
  let storageService: any;

  const ownerBatch = {
    id: 'batch-1',
    name: 'Campanha X',
    createdByUserId: 'owner-1',
    client: { name: 'Cliente A' },
    creatives: [],
    activityLogs: [],
  };

  const creatives = (...statuses: string[]) =>
    statuses.map((status, i) => ({ id: `c${i}`, approval: { status } }));

  beforeEach(() => {
    prisma = {
      batch: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue(ownerBatch),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation(({ data }) => ({
          id: 'batch-1',
          name: 'Campanha X',
          client: { name: 'Cliente A' },
          ...data,
        })),
      },
      creative: { findMany: jest.fn() },
      creativeVersion: { findMany: jest.fn().mockResolvedValue([]) },
    };
    clientsService = {
      verifyOwnership: jest.fn().mockResolvedValue(true),
    };
    notificationsService = { notifyBatchCompleted: jest.fn() };
    storageService = { remove: jest.fn() };
    service = new BatchesService(
      prisma,
      { log: jest.fn() } as any,
      notificationsService,
      clientsService,
      storageService,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the batch does not exist', async () => {
      prisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', 'owner-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the user does not own the batch', async () => {
      prisma.batch.findUnique.mockResolvedValue(ownerBatch);

      await expect(service.findOne('batch-1', 'intruder')).rejects.toThrow(ForbiddenException);
    });

    it('returns the batch for its owner', async () => {
      prisma.batch.findUnique.mockResolvedValue(ownerBatch);

      await expect(service.findOne('batch-1', 'owner-1')).resolves.toEqual(ownerBatch);
    });
  });

  describe('verifyOwnership', () => {
    it('returns false for a non-owner', async () => {
      prisma.batch.findUnique.mockResolvedValue({ createdByUserId: 'owner-1' });

      await expect(service.verifyOwnership('batch-1', 'intruder')).resolves.toBe(false);
    });

    it('returns true for the owner', async () => {
      prisma.batch.findUnique.mockResolvedValue({ createdByUserId: 'owner-1' });

      await expect(service.verifyOwnership('batch-1', 'owner-1')).resolves.toBe(true);
    });
  });

  describe('remove', () => {
    it('refuses to delete a batch the user does not own', async () => {
      prisma.batch.findUnique.mockResolvedValue(ownerBatch);

      await expect(service.remove('batch-1', 'intruder')).rejects.toThrow(ForbiddenException);
      expect(prisma.batch.delete).not.toHaveBeenCalled();
      expect(storageService.remove).not.toHaveBeenCalled();
    });

    it('deletes the batch and its stored files for its owner', async () => {
      prisma.batch.findUnique.mockResolvedValue(ownerBatch);
      prisma.creativeVersion.findMany.mockResolvedValue([
        { fileUrl: '/uploads/a.png' },
        { fileUrl: '/uploads/b.png' },
      ]);

      await service.remove('batch-1', 'owner-1');

      expect(prisma.batch.delete).toHaveBeenCalledWith({ where: { id: 'batch-1' } });
      expect(storageService.remove).toHaveBeenCalledTimes(2);
      expect(storageService.remove).toHaveBeenCalledWith('/uploads/a.png');
    });
  });

  describe('findByAccessToken', () => {
    it('throws NotFoundException for an unknown token', async () => {
      prisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.findByAccessToken('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('returns only pending creatives to the client', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        ...ownerBatch,
        creatives: [
          { id: 'c1', approval: { status: 'PENDING' } },
          { id: 'c2', approval: { status: 'APPROVED' } },
          { id: 'c3', approval: { status: 'REJECTED' } },
        ],
      });

      const result = await service.findByAccessToken('token-1');

      expect(result.creatives.map((c: any) => c.id)).toEqual(['c1']);
      expect(result.allCreativesCount).toBe(3);
    });
  });

  describe('updateCounts', () => {
    it.each([
      [['PENDING', 'PENDING'], 'PENDING'],
      [['APPROVED', 'PENDING'], 'PARTIAL'],
      [['APPROVED', 'REJECTED'], 'COMPLETED'],
    ])('derives status %j -> %s', async (statuses, expected) => {
      prisma.creative.findMany.mockResolvedValue(creatives(...statuses));

      const batch = await service.updateCounts('batch-1');

      expect(batch.status).toBe(expected);
    });

    it('computes the denormalized counters', async () => {
      prisma.creative.findMany.mockResolvedValue(creatives('APPROVED', 'REJECTED', 'PENDING'));

      await service.updateCounts('batch-1');

      expect(prisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalCreatives: 3,
            approvedCount: 1,
            rejectedCount: 1,
            pendingCount: 1,
          }),
        }),
      );
    });

    it('notifies once when the batch becomes COMPLETED', async () => {
      prisma.creative.findMany.mockResolvedValue(creatives('APPROVED', 'REJECTED'));

      await service.updateCounts('batch-1');

      expect(prisma.batch.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'batch-1', status: { not: 'COMPLETED' } } }),
      );
      expect(notificationsService.notifyBatchCompleted).toHaveBeenCalledTimes(1);
    });

    it('does not notify again when another caller already completed the batch', async () => {
      prisma.creative.findMany.mockResolvedValue(creatives('APPROVED', 'REJECTED'));
      prisma.batch.updateMany.mockResolvedValue({ count: 0 });

      await service.updateCounts('batch-1');

      expect(notificationsService.notifyBatchCompleted).not.toHaveBeenCalled();
    });

    it('does not notify while the batch is still partial', async () => {
      prisma.creative.findMany.mockResolvedValue(creatives('APPROVED', 'PENDING'));

      await service.updateCounts('batch-1');

      expect(prisma.batch.updateMany).not.toHaveBeenCalled();
      expect(notificationsService.notifyBatchCompleted).not.toHaveBeenCalled();
    });
  });
});
