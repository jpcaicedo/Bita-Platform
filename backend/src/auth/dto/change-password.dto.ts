import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  @MinLength(8)
  @Matches(/^[a-zA-Z0-9\s-_]+$/, {
    message: 'El campo solo puede contener letras, números, espacios y guiones',
  })
  newPassword!: string;
}
