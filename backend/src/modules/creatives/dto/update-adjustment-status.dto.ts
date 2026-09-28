import { IsIn, IsOptional, IsString } from 'class-validator';

export const ADJUSTMENT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ADJUSTED', 'RESENT'] as const;

export class UpdateAdjustmentStatusDto {
  @IsIn(ADJUSTMENT_STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
