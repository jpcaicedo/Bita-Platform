import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

// Tamaño máximo del texto de la foto (~600 KB de imagen en base64).
// El frontend la achica antes de enviarla, así que normalmente pesa mucho menos.
export const MAX_PHOTO_LENGTH = 800_000;

export class UpdateVehiclePhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_PHOTO_LENGTH, {
    message: 'La foto es demasiado grande',
  })
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, {
    message: 'La foto debe ser una imagen JPEG, PNG o WebP en base64',
  })
  photo!: string;
}
