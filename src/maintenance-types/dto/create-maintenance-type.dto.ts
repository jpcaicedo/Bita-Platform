import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaintenanceTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

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
