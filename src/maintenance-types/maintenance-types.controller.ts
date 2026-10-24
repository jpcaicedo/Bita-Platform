import {
    Body,
    Controller,
    Post,
    UseGuards,
    ValidationPipe,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';
  import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto';
  import { MaintenanceTypesService } from './maintenance-types.service';
  
  const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  @Controller('maintenance-types')
  @UseGuards(JwtAuthGuard)
  export class MaintenanceTypesController {
    constructor(
      private readonly maintenanceTypesService: MaintenanceTypesService,
    ) {}
  
    @Post()
    create(@Body(requestValidationPipe) dto: CreateMaintenanceTypeDto) {
      return this.maintenanceTypesService.create(dto);
    }
  

  }
  