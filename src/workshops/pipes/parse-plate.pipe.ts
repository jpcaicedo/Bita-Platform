import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const PLATE_PATTERN = /^[A-Za-z0-9-]{1,10}$/;

/**
 * Valida la placa que llega por la URL antes de consultar la base de datos.
 * El formato es el mismo que acepta CreateVehicleDto: máximo 10 caracteres,
 * solo letras, números y guiones. La normalización a mayúsculas la hace el
 * servicio, porque la placa se guarda tal como la creó el dueño.
 */
@Injectable()
export class ParsePlatePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const plate = value?.trim() ?? '';

    if (!PLATE_PATTERN.test(plate)) {
      throw new BadRequestException(
        'La placa debe tener máximo 10 caracteres y solo puede contener letras, números y guiones',
      );
    }

    return plate;
  }
}
