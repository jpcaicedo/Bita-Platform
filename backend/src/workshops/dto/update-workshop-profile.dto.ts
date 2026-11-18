import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkshopProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  identification?: string;
}
