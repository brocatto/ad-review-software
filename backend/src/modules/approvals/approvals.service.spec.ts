import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

describe('ApprovalsService', () => {
  const creativeId = '11111111-1111-4111-8111-111111111111';
  let prisma: any;
  let batchesService: any;
  let activityLogService: any;
  let service: ApprovalsService;

  beforeEach(() => {
    prisma = { approval: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    batchesService = {
      findByAccessToken: jest.fn().mockResolvedValue({
        id: 'batch-1',
        creatives: [{ id: creativeId, name: 'Banner', approval: { status: 'PENDING' } }],
      }),
      updateCounts: jest.fn(),
    };
    activityLogService = { log: jest.fn() };
    service = new ApprovalsService(prisma, batchesService, activityLogService);
  });

  it('approves a pending creative, updates counts and logs it', async () => {
    await expect(service.approve('token', { creativeId })).resolves.toEqual({
      success: true,
      status: 'APPROVED',
    });

    expect(prisma.approval.updateMany).toHaveBeenCalledWith({
      where: { creativeId, status: 'PENDING' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(batchesService.updateCounts).toHaveBeenCalledWith('batch-1');
    expect(activityLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATIVE_APPROVED', creativeId }),
    );
  });

  it('stores feedback when rejecting', async () => {
    await service.reject('token', { creativeId, feedback: 'Trocar a cor' });

    expect(prisma.approval.updateMany).toHaveBeenCalledWith({
      where: { creativeId, status: 'PENDING' },
      data: expect.objectContaining({ status: 'REJECTED', feedbackText: 'Trocar a cor' }),
    });
  });

  it('rejects a decision that lost a race with a concurrent one', async () => {
    prisma.approval.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.approve('token', { creativeId })).rejects.toThrow(BadRequestException);
    expect(batchesService.updateCounts).not.toHaveBeenCalled();
    expect(activityLogService.log).not.toHaveBeenCalled();
  });

  it('refuses creatives that already have a decision', async () => {
    batchesService.findByAccessToken.mockResolvedValue({
      id: 'batch-1',
      creatives: [{ id: creativeId, name: 'Banner', approval: { status: 'APPROVED' } }],
    });

    await expect(service.reject('token', { creativeId })).rejects.toThrow(BadRequestException);
    expect(prisma.approval.updateMany).not.toHaveBeenCalled();
  });

  it('refuses creatives from another batch', async () => {
    await expect(
      service.approve('token', { creativeId: '22222222-2222-4222-8222-222222222222' }),
    ).rejects.toThrow(NotFoundException);
  });
});
