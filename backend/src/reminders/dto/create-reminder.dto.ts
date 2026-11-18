import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  @IsOptional()
  maintenanceTypeId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsIn(['due_date', 'due_kilometers'])
  criteria!: 'due_date' | 'due_kilometers';

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  dueKilometers?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  leadDays?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  leadKilometers?: number;

  @IsBoolean()
  @IsOptional()
  recurring?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  recurrenceDays?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  recurrenceKm?: number;
}
