import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevokeAuthorizationDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
