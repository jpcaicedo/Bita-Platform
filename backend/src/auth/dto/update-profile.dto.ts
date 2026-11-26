import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(60)
  username?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(254)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(/^[0-9+\s()-]*$/, {
    message:
      'El teléfono solo puede contener números, espacios, +, - y paréntesis',
  })
  phone?: string;
}
