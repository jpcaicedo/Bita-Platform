import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAuthorizationDto {
  @IsUUID()
  @IsNotEmpty()
  workshopId!: string;

  @IsBoolean()
  @IsOptional()
  canRead?: boolean;

  @IsBoolean()
  @IsOptional()
  canWrite?: boolean;
}
