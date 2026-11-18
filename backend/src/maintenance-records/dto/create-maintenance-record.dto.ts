import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaintenanceRecordDto {
  @IsUUID()
  @IsNotEmpty()
  maintenanceTypeId!: string;

  @IsUUID()
  @IsOptional()
  workshopId?: string;

  @IsDateString()
  @IsNotEmpty()
  serviceDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kilometers!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observations?: string;
}
