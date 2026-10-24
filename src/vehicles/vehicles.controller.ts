import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
  } from '@nestjs/common';
  import { AuthenticatedUser } from '../auth/authenticated-user.interface';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CreateVehicleDto } from './dto/create-vehicle.dto';
  import { UpdateVehicleDto } from './dto/update-vehicle.dto';
  import { VehiclesService } from './vehicles.service';
  
  const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  @Controller('vehicles')
  @UseGuards(JwtAuthGuard)
  export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) {}
  
    @Post()
    create(
      @Body(requestValidationPipe) dto: CreateVehicleDto,
      @Req() request: { user: AuthenticatedUser },
    ) {
      return this.vehiclesService.create(request.user.id, dto);
    }
  
    
  }
  