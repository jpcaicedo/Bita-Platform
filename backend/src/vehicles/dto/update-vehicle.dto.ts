import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'La placa solo puede contener letras, números y guiones',
  })
  plate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  model?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  year?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  currentKilometers?: number;
}
