import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMaintenanceTypeDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultIntervalKm?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultIntervalMonths?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
