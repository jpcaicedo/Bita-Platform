import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { QueryMaintenanceRecordsDto } from './dto/query-maintenance-records.dto';
import { MaintenanceRecordsService } from './maintenance-records.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller()
@UseGuards(JwtAuthGuard)
export class MaintenanceRecordsController {
  constructor(
    private readonly maintenanceRecordsService: MaintenanceRecordsService,
  ) {}

  @Post('vehicles/:vehicleId/maintenance')
  createByOwner(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body(requestValidationPipe) dto: CreateMaintenanceRecordDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.maintenanceRecordsService.createByOwner(
      vehicleId,
      request.user,
      dto,
    );
  }

  @Get('vehicles/:vehicleId/maintenance/status')
  getHealth(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.maintenanceRecordsService.getHealth(vehicleId, request.user);
  }

  @Get('vehicles/:vehicleId/maintenance')
  findByVehicle(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query(requestValidationPipe) query: QueryMaintenanceRecordsDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.maintenanceRecordsService.findByVehicle(
      vehicleId,
      request.user,
      query,
    );
  }

  @Post('workshops/vehicles/:vehicleId/maintenance')
  createByWorkshop(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body(requestValidationPipe) dto: CreateMaintenanceRecordDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.maintenanceRecordsService.createByWorkshop(
      vehicleId,
      request.user,
      dto,
    );
  }
}