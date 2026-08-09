import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BatchesService } from './batches.service';

describe('BatchesService', () => {
  let service: BatchesService;
  let prisma: any;
  let clientsService: any;

  const ownerBatch = {
    id: 'batch-1',
    name: 'Campanha X',
    createdByUserId: 'owner-1',
    client: { name: 'Cliente A' },
    creatives: [],
    activityLogs: [],
  };

  beforeEach(() => {
    prisma = {
      batch: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue(ownerBatch),
      },
    };
    clientsService = {
      verifyOwnership: jest.fn().mockResolvedValue(true),
    };
    service = new BatchesService(prisma, {} as any, {} as any, clientsService);
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
    });

    it('deletes the batch for its owner', async () => {
      prisma.batch.findUnique.mockResolvedValue(ownerBatch);

      await service.remove('batch-1', 'owner-1');

      expect(prisma.batch.delete).toHaveBeenCalledWith({ where: { id: 'batch-1' } });
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
});
