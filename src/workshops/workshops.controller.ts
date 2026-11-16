import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkshopProfileDto } from './dto/create-workshop-profile.dto';
import { UpdateWorkshopProfileDto } from './dto/update-workshop-profile.dto';
import { ParsePlatePipe } from './pipes/parse-plate.pipe';
import { WorkshopsService } from './workshops.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('workshops')
@UseGuards(JwtAuthGuard)
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  // Crear el perfil convierte al usuario en taller (el rol es implícito).
  @Post()
  create(
    @Body(requestValidationPipe) dto: CreateWorkshopProfileDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.workshopsService.create(request.user.id, dto);
  }

  // Devuelve 404 si el usuario no es taller: así el front detecta el rol.
  @Get('me')
  findMine(@Req() request: { user: AuthenticatedUser }) {
    return this.workshopsService.findByUser(request.user.id);
  }

  @Patch('me')
  updateMine(
    @Body(requestValidationPipe) dto: UpdateWorkshopProfileDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.workshopsService.update(request.user.id, dto);
  }

  // Vehículos con una autorización activa del taller autenticado.
  @Get('vehicles')
  findVehicles(@Req() request: { user: AuthenticatedUser }) {
    return this.workshopsService.findAuthorizedVehicles(request.user.id);
  }

  // Recepción técnica: buscar por placa e informar si hay autorización.
  @Get('vehicles/plate/:plate')
  findVehicleByPlate(
    @Param('plate', ParsePlatePipe) plate: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.workshopsService.findVehicleByPlate(plate, request.user.id);
  }
}
