import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADJUSTMENT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ADJUSTED', 'RESENT'] as const;

export class UpdateAdjustmentStatusDto {
  @IsIn(ADJUSTMENT_STATUSES, { message: 'Status de ajuste inválido' })
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
