import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryMaintenanceRecordsDto {
  @IsUUID()
  @IsOptional()
  maintenanceTypeId?: string;

  @IsUUID()
  @IsOptional()
  workshopId?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
