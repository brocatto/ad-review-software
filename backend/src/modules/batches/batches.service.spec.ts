import { BatchesService } from './batches.service';

describe('BatchesService.updateCounts', () => {
  let prisma: any;
  let notificationsService: any;
  let service: BatchesService;

  const creatives = (...statuses: string[]) =>
    statuses.map((status, i) => ({ id: `c${i}`, approval: { status } }));

  beforeEach(() => {
    prisma = {
      creative: { findMany: jest.fn() },
      batch: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation(({ data }) => ({
          id: 'batch-1',
          name: 'Lote',
          client: { name: 'Cliente' },
          ...data,
        })),
      },
    };
    notificationsService = { notifyBatchCompleted: jest.fn() };
    service = new BatchesService(prisma, { log: jest.fn() } as any, notificationsService, {} as any);
  });

  it.each([
    [['PENDING', 'PENDING'], 'PENDING'],
    [['APPROVED', 'PENDING'], 'PARTIAL'],
    [['APPROVED', 'REJECTED'], 'COMPLETED'],
  ])('%j -> %s', async (statuses, expected) => {
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

    expect(notificationsService.notifyBatchCompleted).toHaveBeenCalledTimes(1);
  });

  it('does not notify again when another caller already completed the batch', async () => {
    prisma.creative.findMany.mockResolvedValue(creatives('APPROVED', 'REJECTED'));
    prisma.batch.updateMany.mockResolvedValue({ count: 0 });

    await service.updateCounts('batch-1');

    expect(notificationsService.notifyBatchCompleted).not.toHaveBeenCalled();
  });
});
