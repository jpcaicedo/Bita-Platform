import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateVehiclePhotoDto } from './dto/update-vehicle-photo.dto';
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

  @Get()
  findAll(@Req() request: { user: AuthenticatedUser }) {
    return this.vehiclesService.findAllByOwner(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.vehiclesService.findOwnedOrFail(id, request.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.vehiclesService.remove(id, request.user.id);
  }

  @Get(':id/photo')
  async getPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const photo = await this.vehiclesService.getPhoto(id, request.user.id);
    return { photo };
  }

  @Put(':id/photo')
  async updatePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) dto: UpdateVehiclePhotoDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    await this.vehiclesService.updatePhoto(id, request.user.id, dto.photo);
    return { photo: dto.photo };
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) dto: UpdateVehicleDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.vehiclesService.update(id, request.user.id, dto);
  }
}
