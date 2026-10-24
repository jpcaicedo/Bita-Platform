import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CompleteReminderDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  kilometers?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
