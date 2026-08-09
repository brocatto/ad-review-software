import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let prisma: any;
  let batchesService: any;
  let activityLogService: any;

  const makeBatch = () => ({
    id: 'batch-1',
    creatives: [{ id: 'creative-1', name: 'Creative 1', approval: { status: 'PENDING' } }],
  });

  beforeEach(() => {
    prisma = {
      approval: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    batchesService = {
      findByAccessToken: jest.fn().mockResolvedValue(makeBatch()),
      updateCounts: jest.fn().mockResolvedValue(undefined),
    };
    activityLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    service = new ApprovalsService(prisma, batchesService, activityLogService);
  });

  describe('approve', () => {
    it('approves a pending creative and updates batch counts', async () => {
      const result = await service.approve('token-1', { creativeId: 'creative-1' });

      expect(result).toEqual({ success: true, status: 'APPROVED' });
      expect(prisma.approval.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { creativeId: 'creative-1', status: 'PENDING' },
        }),
      );
      expect(batchesService.updateCounts).toHaveBeenCalledWith('batch-1');
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATIVE_APPROVED', creativeId: 'creative-1' }),
      );
    });

    it('throws NotFoundException when the creative is not in the batch', async () => {
      await expect(
        service.approve('token-1', { creativeId: 'not-in-batch' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.approval.updateMany).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the creative was already decided (concurrent request)', async () => {
      prisma.approval.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.approve('token-1', { creativeId: 'creative-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(batchesService.updateCounts).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('rejects a pending creative and stores the feedback', async () => {
      const result = await service.reject('token-1', {
        creativeId: 'creative-1',
        feedback: 'Trocar a cor do fundo',
      });

      expect(result).toEqual({ success: true, status: 'REJECTED' });
      expect(prisma.approval.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { creativeId: 'creative-1', status: 'PENDING' },
          data: expect.objectContaining({
            status: 'REJECTED',
            feedbackText: 'Trocar a cor do fundo',
          }),
        }),
      );
      expect(activityLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATIVE_REJECTED' }),
      );
    });

    it('throws BadRequestException when the creative was already decided (concurrent request)', async () => {
      prisma.approval.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.reject('token-1', { creativeId: 'creative-1', feedback: 'x' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
